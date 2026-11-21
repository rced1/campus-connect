/**
 * Pictures for the prototype.
 *
 * Profile photos and store pictures are keyed by id. Card covers are keyed by
 * the card title, matching the files in photos/cards. A card without a photo
 * keeps its color block. A person without their own headshot reuses one of these.
 *
 *   PROFILE_PHOTOS["maya-chen"] = "photos/profiles/maya-chen.jpg";
 *   STORE_PHOTOS["maya-makes-photo"] = "photos/stores/maya-makes-photo.jpg";
 */
const CAMPUS_ASSET_ROOT = "/campus";

const PROFILE_PHOTOS = {
  "ari-patel": `${CAMPUS_ASSET_ROOT}/photos/profiles/ari-patel.jpg`,
  "chris-nguyen": `${CAMPUS_ASSET_ROOT}/photos/profiles/chris-nguyen.jpg`,
  "jordan-lee": `${CAMPUS_ASSET_ROOT}/photos/profiles/jordan-lee.jpg`,
  "riley-kim": `${CAMPUS_ASSET_ROOT}/photos/profiles/riley-kim.jpg`,
  "sam-okafor": `${CAMPUS_ASSET_ROOT}/photos/profiles/sam-okafor.jpg`,
  "taylor-brooks": `${CAMPUS_ASSET_ROOT}/photos/profiles/taylor-brooks.jpg`,
  "zoe-rivera": `${CAMPUS_ASSET_ROOT}/photos/profiles/zoe-rivera.jpg`,
  "agent-sofia": `${CAMPUS_ASSET_ROOT}/photos/profiles/sofia-nguyen.jpg`,
  "agent-quinn": `${CAMPUS_ASSET_ROOT}/photos/profiles/quinn-alvarez.jpg`
};
const STORE_PHOTOS = {};

const CARD_PHOTO_FILES = [
  "Aztecs vs. Boise State.png",
  "BLVD63.png",
  "Calc II study guide.png",
  "Calculus II tutoring.png",
  "Camila Reyes.png",
  "Campus photo print (8x10).png",
  "Color film roll (36 exp).png",
  "Comedy night.png",
  "Custom press-on set.png",
  "Elise Cho.png",
  "Event & org photo coverage.png",
  "Event staff.png",
  "Film developing & scans.png",
  "Grad portraits with Maya.png",
  "Handmade ceramic mug.png",
  "Harper Diaz.png",
  "Intro to the pottery wheel.png",
  "Library desk assistant.png",
  "Lifeguard.png",
  "Lightroom preset pack.png",
  "Linear algebra tutoring.png",
  "LinkedIn headshots.png",
  "Malik Johnson.png",
  "Master bedroom sublease.png",
  "Midterm cram session (group).png",
  "Nail art add-on.png",
  "Note taker.png",
  "Open Air concert.png",
  "Open studio night.png",
  "Opening barista.png",
  "Org formal guest ticket.png",
  "35mm film camera.jpg",
  "Calculus II textbook.jpg",
  "Fifty Six East.jpg",
  "Owen Blake.png",
  "Private room in a 4-bedroom.jpg",
  "Quiet desk fan.jpg",
  "Quinn Alvarez.png",
  "Research assistant.jpg",
  "Shared room, spring only.jpg",
  "Short-form video edit.jpg",
  "SDSU Safe Ride.jpg",
  "Slow Hours live.jpg",
  "Sofia Nguyen.jpg",
  "Soft gel set by Zoe.jpg",
  "South Campus Plaza.png",
  "Speckled planter.jpg",
  "Summer studio sublease.jpg",
  "The Granada.png",
  "University Towers.jpg",
  "Unscripted.jpg",
  "Vintage campus hoodie.jpg",
  "Vintage desk lamp.jpg",
  "YouTube thumbnail design.jpg"
];

function cardPhotoKey(title) {
  return String(title || "").toLowerCase().replace(/×/g, "x").replace(/\s+/g, " ").trim();
}

const CARD_PHOTOS = Object.fromEntries(CARD_PHOTO_FILES.map((file) => [cardPhotoKey(file.replace(/\.(png|jpe?g)$/i, "")), `${CAMPUS_ASSET_ROOT}/photos/cards/${file}`]));

function cardPhoto(title) {
  return CARD_PHOTOS[cardPhotoKey(title)] || "";
}

function photoSrc(path) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function cardPhotoImg(title) {
  const src = cardPhoto(title);
  if (!src) return "";
  return `<img class="card-photo" src="${escapeHtml(photoSrc(src))}" alt="" />`;
}

/**
 * A colored media block. The card photo for `title` replaces `fallback`.
 * `before` and `after` always render (a badge or caption sitting on the block).
 */
function framedMedia(tag, className, title, fallback = "", { before = "", after = "" } = {}) {
  const photo = cardPhotoImg(title);
  return `<${tag} class="${className}${photo ? " has-photo" : ""}">${before}${photo || fallback}${after}</${tag}>`;
}

/** Initials, or the profile photo, inside `tag`. `attrs` is extra attributes such as aria-hidden. */
function personMark(tag, className, initials, personId, attrs = "") {
  const extra = attrs ? ` ${attrs}` : "";
  return `<${tag} class="${avatarClass(className, personId)}"${extra}>${avatarContents(initials, personId)}</${tag}>`;
}

/** Small checkout and order thumb: the card photo, or the emoji when there isn't one. */
function cardThumb(title, accent, emoji) {
  return framedMedia("div", `summary-thumb ${accent}`, title, emoji);
}

const PROFILE_POOL = Object.values(PROFILE_PHOTOS);

function profileHash(key) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash + key.charCodeAt(index) * (index + 1)) % PROFILE_POOL.length;
  return PROFILE_POOL[hash];
}

function profilePhoto(personId) {
  if (!personId || !PROFILE_POOL.length) return "";
  const key = String(personId);
  if (PROFILE_PHOTOS[key]) return PROFILE_PHOTOS[key];
  if (typeof data !== "undefined" && data) {
    const seller = data.sellers?.find((person) => person.id === key || person.name === key);
    if (seller && PROFILE_PHOTOS[seller.id]) return PROFILE_PHOTOS[seller.id];
    const agent = data.agents?.find((person) => person.id === key || person.name === key);
    if (agent && PROFILE_PHOTOS[agent.id]) return PROFILE_PHOTOS[agent.id];
  }
  return profileHash(key);
}

function storePhoto(storeId) {
  return storeId ? STORE_PHOTOS[storeId] || "" : "";
}

function avatarClass(className, personId) {
  return `${className}${profilePhoto(personId) ? " has-photo" : ""}`;
}

/** Initials, or the profile photo when this person has one. */
function avatarContents(initials, personId) {
  const src = profilePhoto(personId);
  if (!src) return escapeHtml(initials);
  return `<img class="avatar-photo" src="${escapeHtml(src)}" alt="" />`;
}

function storeBannerClass(store, className = "store-card-banner") {
  return `${className} ${store.accent}${storePhoto(store.id) ? " has-photo" : ""}`;
}

/** The store picture, or the colored banner's usual contents when there isn't one. */
function storeBannerContents(store, fallback = "") {
  const src = storePhoto(store.id);
  if (!src) return fallback;
  return `<img class="store-photo" src="${escapeHtml(src)}" alt="" />`;
}

function storeMarkClass(store) {
  return `store-logo-small ${store.accent}${storePhoto(store.id) ? " has-photo" : ""}`;
}

function storeMarkContents(store) {
  const src = storePhoto(store.id);
  if (!src) return store.emoji;
  return `<img class="avatar-photo" src="${escapeHtml(src)}" alt="" />`;
}
