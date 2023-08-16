const { Comment } = require("../models/Comment.js");

// GraphQL Resolvers
const resolvers = {
	Query: {
		comments: async (parent, args) => await Comment.find({category: "comment", ref: args.ref}),
		comment: async (parent, args) => await Comment.findById(args.id),
	},
	Mutation: {
		comment: async (parent, args) =>
		{
			const newComment = new Comment({
				ref: args.ref,
				title: args.title,
				description: args.description,
				rating: args.rating
			});
			
			await newComment.save();
			
			return newComment;
		},
	},
};

module.exports = { resolvers };
