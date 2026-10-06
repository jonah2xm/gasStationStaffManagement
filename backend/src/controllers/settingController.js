const Setting = require("../models/settingModel");

// Coordonnées affichées sur la page de connexion (mot de passe oublié, accès).
const CONTACT_FIELDS = ["nom", "service", "telephone", "email", "horaires"];
const CONTACT_LIMITS = { nom: 80, service: 80, telephone: 30, email: 120, horaires: 120 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+().\s/-]{6,30}$/;

const emptyContact = () => Object.fromEntries(CONTACT_FIELDS.map((field) => [field, ""]));

// Public : la page de connexion l'affiche avant toute authentification.
const getContact = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: "contact" }).lean();
    res.status(200).json({ ...emptyContact(), ...(setting?.value || {}), updatedAt: setting?.updatedAt || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateContact = async (req, res) => {
  const contact = emptyContact();
  for (const field of CONTACT_FIELDS) {
    const raw = req.body?.[field];
    contact[field] = typeof raw === "string" ? raw.trim() : "";
    if (contact[field].length > CONTACT_LIMITS[field]) {
      return res.status(400).json({ message: `Le champ « ${field} » est trop long.` });
    }
  }

  if (!contact.telephone && !contact.email) {
    return res.status(400).json({ message: "Indiquez au moins un téléphone ou une adresse email." });
  }
  if (contact.email && !EMAIL_RE.test(contact.email)) {
    return res.status(400).json({ message: "Adresse email invalide." });
  }
  if (contact.telephone && !PHONE_RE.test(contact.telephone)) {
    return res.status(400).json({ message: "Numéro de téléphone invalide." });
  }

  try {
    const setting = await Setting.findOneAndUpdate(
      { key: "contact" },
      { value: contact, updatedBy: req.session?.user?.username },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.status(200).json({ ...setting.value, updatedAt: setting.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getContact, updateContact };
