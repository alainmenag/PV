const gql = require("graphql-tag");

const typeDefs = gql`

	type Query {
		comments(ref: ID): [Comment] #return array of Comments
		comment(id: ID): Comment #return Comment by id
	}
	
	# Comment object
	type Comment {
		_id: ID
		title: String
		description: String
		rating: Int
	}
	
	# Mutation
	type Mutation {
		comment(title: String, description: String, rating: Int, ref: ID): Comment
	}
	
`;

module.exports = { typeDefs };