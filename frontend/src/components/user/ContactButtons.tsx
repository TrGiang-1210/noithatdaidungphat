// ============================================================
// ContactButtons.tsx  –  icon app gốc, SVG inline chính xác
// Đặt file tại: src/components/user/ContactButtons.tsx
// ============================================================
import "@/styles/components/user/contactButtons.scss";

// ─── ĐỔI THÔNG TIN CỦA BẠN Ở ĐÂY ────────────────────────────
const PHONE_NUMBER      = "0965708839";
const ZALO_LINK       = "noithatdaidungphat";  // vd: noithatdaidungphat (không có "https://zalo.me/")
const MESSENGER_PAGE_ID = "noithatredepla";   // vd: daidungphat
const GOOGLE_MAPS_URL   = "https://maps.app.goo.gl/Vqz27iHmAVdvC7fw6";
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// SVG ICONS — path data chính xác từ nguồn brand gốc
// ─────────────────────────────────────────────────────────────

/**
 * Phone — Google Material Design "call" icon
 * Source: material.io/icons
 */
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="white">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);

/**
 * Zalo — Option C: chữ "Zalo" bold nhỏ, rõ ràng
 */
const ZaloIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 24"
    width="46"
    height="18"
    aria-hidden="true"
  >
    <text
      x="30" y="19"
      textAnchor="middle"
      fill="white"
      fontSize="20"
      fontWeight="900"
      fontFamily="Arial Black, Impact, sans-serif"
    >
      Zalo
    </text>
  </svg>
);

/**
 * Facebook Messenger — Meta official Messenger logo
 * Source: Simple Icons — slug: messenger
 * viewBox: 0 0 24 24
 */
const MessengerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="white">
    <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);

/**
 * Google Maps — official Google Maps logo path
 * Source: Simple Icons — slug: googlemaps
 * viewBox: 0 0 24 24  (đa sắc: dùng nền trắng + màu đỏ Google)
 */
const MapsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26">
    {/* Nền trắng đã set trong class --maps */}
    {/* Pin shape */}
    <path
      d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
      fill="#EA4335"
    />
    <path
      d="M12 0C9.903 0 8 .8 6.5 2.1L12 8l5.5-5.9C16 .8 14.097 0 12 0Z"
      fill="#34A853"
    />
    <path
      d="M4 7.6C4 5.1 5.1 2.9 6.8 1.4L12 8 8 14.2C5.6 12.7 4 10.3 4 7.6Z"
      fill="#4285F4"
    />
    <path
      d="M20 7.6C20 10.3 18.4 12.7 16 14.2L12 8l5.2-6.6C19 2.9 20 5.1 20 7.6Z"
      fill="#FBBC04"
    />
    <circle cx="12" cy="8" r="2.5" fill="white"/>
  </svg>
);

// ── Buttons config ─────────────────────────────────────────────
const BUTTONS = [
  {
    id:       "phone",
    modifier: "phone",
    href:     `tel:${PHONE_NUMBER}`,
    tooltip:  PHONE_NUMBER,
    external: false,
    icon:     <PhoneIcon />,
  },
  {
    id:       "zalo",
    modifier: "zalo",
    href:     `https://zalo.me/${ZALO_LINK}`,
    tooltip:  "Chat Zalo",
    external: true,
    icon:     <ZaloIcon />,
  },
  {
    id:       "messenger",
    modifier: "messenger",
    href:     `https://m.me/${MESSENGER_PAGE_ID}`,
    tooltip:  "Chat Messenger",
    external: true,
    icon:     <MessengerIcon />,
  },
  {
    id:       "maps",
    modifier: "maps",
    href:     GOOGLE_MAPS_URL,
    tooltip:  "Chỉ đường",
    external: true,
    icon:     <MapsIcon />,
  },
];

// ── Component ──────────────────────────────────────────────────
const ContactButtons = () => (
  <div className="contact-buttons" role="complementary" aria-label="Liên hệ nhanh">
    {BUTTONS.map((btn) => (
      <div key={btn.id} className="contact-buttons__item">
        <a
          href={btn.href}
          target={btn.external ? "_blank" : undefined}
          rel={btn.external ? "noopener noreferrer" : undefined}
          className={`contact-buttons__btn contact-buttons__btn--${btn.modifier}`}
          aria-label={btn.tooltip}
        >
          {btn.icon}
        </a>
        <span className="contact-buttons__tooltip" aria-hidden="true">
          {btn.tooltip}
        </span>
      </div>
    ))}
  </div>
);

export default ContactButtons;