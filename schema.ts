export const schema = `#graphql
    input CreateUserInput{
        name: String!
        password: String!
        email: String!
    }

    input UpdateUserInput{
        id: String!,
        name: String
        password: String
        email: String
    }

    input CreatePostInput{
        userId: String!,
        content: String!
    }

    input UpdatePostInput{
        id: String!,
        content: String!
    }

    input CreateCommentInput{
        userId: String!,
        postId: String!,
        text: String!
    }

    input UpdateCommentInput{
        id: String!,
        text: String!
    }

    type User{
        id: ID!
        name: String!
        password: String!
        email: String!
        posts: [Post!]!
        comments: [Comment!]!
        likedPosts: [Post!]!
    }

    type Post{
        id: ID!
        content: String!
        author: User!
        comments: [Comment!]!
        likes: [User!]!
    }

    type Comment{
        id: ID!
        text: String!
        author: User!
        post: Post!
    }

    type Query{
        users: [User!]!
        user(id: ID!): User

        posts: [Post!]!
        post(id: ID!): Post

        comments: [Comment!]!
        comment(id: ID!): Comment
    }

    type Mutation{
        createUser(input: CreateUserInput!): User!
        updateUser(id: ID!, input: UpdateUserInput!): User!
        deleteUser(id: ID!): Boolean!

        createPost(input: CreatePostInput!): Post!
        updatePost(id: ID!, input: UpdatePostInput): Post!
        deletePost(id: ID!): Boolean!

        addLikeToPost(postId: ID!, userId: ID!): Post!
        removeLikeFromPost(postId: ID!, userId: ID!): Post!

        createComment(input: CreateCommentInput!): Comment!
        updateComment(id: ID!, input: UpdateCommentInput!): Comment!
        deleteComment(id: ID!): Boolean!
    }
`