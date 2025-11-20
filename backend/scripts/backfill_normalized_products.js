const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');
dotenv.config();

const normalizeString = (s) =>
  s && s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const cursor = Product.find().cursor();
  let cnt = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const changed = {};
    const nn = normalizeString(doc.name);
    const sn = normalizeString(doc.slug || doc.name);
    if (doc.name_normalized !== nn) changed.name_normalized = nn;
    if (doc.slug_normalized !== sn) changed.slug_normalized = sn;
    if (Object.keys(changed).length) {
      await Product.updateOne({ _id: doc._id }, { $set: changed });
      cnt++;
    }
  }
  console.log('Updated', cnt, 'products');
  await mongoose.disconnect();
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });