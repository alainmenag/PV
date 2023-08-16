const mongoose = require("mongoose");

const Comment = mongoose.model("Comment", {
	title: String,
	description: String,
	rating: Number,
}, 'profiles');

module.exports = { Comment };




/*
const newComment = new Comment({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
});

newComment.save()
  .then(savedComment => {
    console.log('Comment saved:', savedComment);
  })
  .catch(error => {
    console.error('Error saving comment:', error);
  });
*/