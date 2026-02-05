// backend/controllers/translation.controller.js
const Translation = require("../models/Translation");
const TranslationRequest = require("../models/TranslationRequest");
const aiTranslationService = require("../services/aiTranslation.service");

// 1. GET: Lấy tất cả translations theo ngôn ngữ (cho Frontend)
exports.getTranslations = async (req, res) => {
  try {
    const { lang = "vi", namespace } = req.query;

    const translations = await Translation.getByLanguage(lang, namespace);

    res.json({
      success: true,
      data: translations,
      language: lang,
      namespace: namespace || "all",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. GET: Lấy danh sách keys để quản lý (Admin Panel)
exports.getTranslationKeys = async (req, res) => {
  try {
    const { page = 1, limit = 50, namespace, status, search } = req.query;

    const query = {};
    if (namespace) query.namespace = namespace;
    if (status && status !== 'all') query[`translations.zh.status`] = status;
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: "i" } },
        { "translations.vi.value": { $regex: search, $options: "i" } },
      ];
    }

    const keys = await Translation.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const count = await Translation.countDocuments(query);

    res.json({
      success: true,
      data: keys,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. POST: Tạo translation key mới
exports.createTranslationKey = async (req, res) => {
  try {
    const { key, namespace, viText, context, category } = req.body;

    // Check if key exists
    const existing = await Translation.findOne({ key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Translation key already exists",
      });
    }

    const translation = new Translation({
      key,
      namespace,
      context,
      category,
      translations: {
        vi: {
          value: viText,
          status: "draft",
          translatedBy: req.user.id,
          lastModified: new Date(),
        },
        zh: {
          status: "draft",
        },
      },
    });

    await translation.save();

    res.status(201).json({
      success: true,
      message: "Translation key created",
      data: translation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. POST: Request AI translation cho 1 key
exports.requestAITranslation = async (req, res) => {
  try {
    const { translationId, targetLang = "zh" } = req.body;

    const translation = await Translation.findById(translationId);
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    const sourceText = translation.translations.vi.value;

    // Create translation request
    const request = new TranslationRequest({
      translationId,
      sourceLang: "vi",
      targetLang,
      sourceText,
      status: "processing",
    });
    await request.save();

    // Call AI service
    try {
      const result = await aiTranslationService.translateWithClaude(
        sourceText,
        "vi",
        targetLang,
        translation.context,
      );

      // Update request
      request.aiResult = result.translation;
      request.aiProvider = result.provider;
      request.aiConfidence = result.confidence;
      request.status = "completed";
      await request.save();

      // Update translation
      translation.translations[targetLang] = {
        value: result.translation,
        status: "ai_translated",
        translatedBy: "ai",
        lastModified: new Date(),
      };
      await translation.save();

      res.json({
        success: true,
        message: "AI translation completed",
        data: {
          translation: result.translation,
          confidence: result.confidence,
          requestId: request._id,
        },
      });
    } catch (aiError) {
      request.status = "failed";
      request.error = aiError.message;
      await request.save();

      throw aiError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. POST: Batch AI translation
exports.batchAITranslation = async (req, res) => {
  try {
    const { translationIds, targetLang = "zh" } = req.body;

    if (!Array.isArray(translationIds) || translationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "translationIds must be a non-empty array",
      });
    }

    const translations = await Translation.find({
      _id: { $in: translationIds },
    });

    const textsToTranslate = translations.map((t) => ({
      key: t.key,
      text: t.translations.vi.value,
      context: t.context,
    }));

    // AI batch translate
    const results = await aiTranslationService.batchTranslate(
      textsToTranslate,
      "vi",
      targetLang,
    );

    // Update translations
    const updatePromises = results.map(async (result) => {
      if (result.success) {
        const translation = translations.find((t) => t.key === result.key);
        translation.translations[targetLang] = {
          value: result.translation,
          status: "ai_translated",
          translatedBy: "ai",
          lastModified: new Date(),
        };
        await translation.save();
      }
    });

    await Promise.all(updatePromises);

    const successCount = results.filter((r) => r.success).length;

    res.json({
      success: true,
      message: `Translated ${successCount}/${results.length} keys`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. PUT: Human review và edit translation
exports.reviewTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang, value, status, reviewNote } = req.body;

    const translation = await Translation.findById(id);
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    // Save to history
    translation.history.push({
      version: translation.version,
      lang,
      oldValue: translation.translations[lang].value,
      newValue: value,
      changedBy: req.user.id,
      changedAt: new Date(),
      reason: reviewNote || "Human review",
    });

    // Update translation
    translation.translations[lang] = {
      value,
      status: status || "human_reviewed",
      reviewedBy: req.user.id,
      lastModified: new Date(),
    };

    translation.version += 1;
    await translation.save();

    res.json({
      success: true,
      message: "Translation reviewed and updated",
      data: translation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. GET: Translation statistics
exports.getStatistics = async (req, res) => {
  try {
    const stats = await Translation.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: "$translations.zh.status",
                count: { $sum: 1 },
              },
            },
          ],
          byNamespace: [
            {
              $group: {
                _id: "$namespace",
                count: { $sum: 1 },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
