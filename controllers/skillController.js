const Skill = require("../model/skillSchema");

// GET all skills (optionally filter by search term, category, etc.)
exports.getSkills = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const skills = await Skill.find(filter).limit(50).sort({ popularity: -1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
