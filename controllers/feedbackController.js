const User = require('../model/userSchema');
const Session = require("../model/sessionSchema");

exports.submitFeedback = async (req, res) => {
  try {
    const { sessionId, rating, review } = req.body;
    const userId = req.user._id; // Assume user is authenticated

    // Find session to verify validity
    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'completed') {
      return res.status(400).json({ message: 'Invalid or incomplete session' });
    }

    // Store feedback
    session.mentorId = session.mentorId; // For clarity
    session.menteeId = session.menteeId;

    // Add review to mentor profile
    const mentor = await User.findById(session.mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Push review into mentor feedback array and recalculate ratings
    mentor.feedback.push({ sessionId, from: userId, rating, review });
    mentor.mentorRating.totalReviews += 1;
    // Recalculate average rating
    const totalRatings = mentor.mentorRating.average * (mentor.mentorRating.totalReviews - 1) + rating;
    mentor.mentorRating.average = totalRatings / mentor.mentorRating.totalReviews;

    await mentor.save();

    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting feedback', error: err.message });
  }
};
