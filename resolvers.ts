import { Collection, ObjectId } from "mongodb";
import { CommentModel, PostModel, UserModel } from "./types.ts";
import { GraphQLError } from "graphql";
import { encodeHex } from "jsr:@std/encoding/hex"; //Sacado de: https://docs.deno.com/examples/hashing/


type userCtx = {
    UsersCollection: Collection<UserModel>
}

type postCtx = {
    PostsCollection: Collection<PostModel>
}

type userPostCtx = {
    PostsCollection: Collection<PostModel>
    UsersCollection: Collection<UserModel>
}

type commentCtx = {
    CommentsCollection: Collection<CommentModel>
}

type fullContext = {
    UsersCollection: Collection<UserModel>
    PostsCollection: Collection<PostModel>
    CommentsCollection: Collection<CommentModel>
}

type QueryArgs = {
    id: string
}

type CreateUserInput = {
    input: {
        name: string
        password: string
        email: string
    }
}

type UpdateUserInput = {
    id: string,
    input: {
        name: string
        password: string
        email: string
    }
}

type CreatePostInput = {
    userId: string,
    input: {
        content: string
    }
}

type UpdatePostInput = {
    id: string,
    input: {
        content: string
    }
}

type AddLikeToPostArgs = {
    postId: string,
    userId: string
}

type CreateCommentInput = {
    userId: string,
    postId: string,
    input: {
        text: string
    } 
}

type UpdateCommentInput = {
    id: string,
    input: {
        text: string
    } 
}

export const resolvers = {
    User: {
        id: (parent: UserModel) => {
            return parent._id?.toString();
        },

        posts: async (parent: UserModel, _: unknown, ctx: postCtx) => {
            const ids = parent.posts;
            return await ctx.PostsCollection.find({ _id: { $in: ids } }).toArray();
        },

        comments: async (parent: UserModel, _: unknown, ctx: commentCtx) => {
            const ids = parent.comments;
            return await ctx.CommentsCollection.find({ _id: { $in: ids } }).toArray();
        },

        likedPosts: async (parent: UserModel, _: unknown, ctx: postCtx) => {
            const ids = parent.likedPosts;
            return await ctx.PostsCollection.find({ _id: { $in: ids } }).toArray();
        }
    },


    Post: {
        id: (parent: PostModel) => {
            return parent._id?.toString();
        },

        author: async (parent: PostModel, _: unknown, ctx: userCtx) => {
            const id = parent.author;
            return await ctx.UsersCollection.findOne({  _id: new ObjectId(id) });
        },

        comments: async (parent: PostModel, _: unknown, ctx: commentCtx) => {
            const ids = parent.comments;
            return await ctx.CommentsCollection.find({ _id: { $in: ids } }).toArray();
        },

        likes: async (parent: PostModel, _: unknown, ctx: userCtx) => {
            const ids = parent.likes;
            return await ctx.UsersCollection.find({ _id: { $in: ids } }).toArray();
        }
    },


    Comment: {
        id: (parent: CommentModel) => {
            return parent._id?.toString();
        },

        author: async (parent: CommentModel, _: unknown, ctx: userCtx) => {
            const id = parent.author;
            return await ctx.UsersCollection.findOne({  _id: new ObjectId(id) });
        },

        post: async (parent: CommentModel, _: unknown, ctx: postCtx) => {
            const id = parent.post;
            return await ctx.PostsCollection.findOne({  _id: new ObjectId(id) });
        }
    },


    Query: {
        users: async (_:unknown, __: unknown, ctx: userCtx): Promise<UserModel[]> => {
            const users = await ctx.UsersCollection.find().toArray();
            return users;
        },

        user: async (_: unknown, args: QueryArgs, ctx: userCtx): Promise<UserModel | null> => {
            const id = args.id;

            const user = await ctx.UsersCollection.findOne({  _id: new ObjectId(id) });
            return user;
        },


        posts: async (_:unknown, __: unknown, ctx: postCtx): Promise<PostModel[]> => {
            const posts = await ctx.PostsCollection.find().toArray();
            return posts;
        },

        post: async (_: unknown, args: QueryArgs, ctx: postCtx): Promise<PostModel | null> => {
            const id = args.id;

            const post = await ctx.PostsCollection.findOne({  _id: new ObjectId(id) });
            return post;
        },


        comments: async (_: unknown, __: unknown, ctx: commentCtx): Promise<CommentModel[]> => {
            const comments = await ctx.CommentsCollection.find().toArray();
            return comments;
        },

        comment: async (_: unknown, args: QueryArgs, ctx: commentCtx): Promise<CommentModel | null> => {
            const id = args.id;

            const comment = await ctx.CommentsCollection.findOne({  _id: new ObjectId(id) });
            return comment;
        }
    },

    Mutation: {
        createUser: async (_: unknown, args: CreateUserInput, ctx: userCtx) => {
            const { name, password, email } = args.input;

            const existsUser = await ctx.UsersCollection.findOne({ email });
            if(existsUser) throw new GraphQLError("User exists");

            //Sacado de: https://docs.deno.com/examples/hashing/
            const hashedPassword = await encodeHex(password);

            const user = await ctx.UsersCollection.insertOne({
              name,
              password: hashedPassword,
              email,
              posts: [],
              comments: [],
              likedPosts: []
            })

            return {
                _id: user.insertedId,
                name,
                email,
                posts: [],
                comments: [],
                likedPosts: []
            }
        },

        updateUser: async (_: unknown, args: UpdateUserInput, ctx: userCtx) => {
            const { id } = args;
            const { name, password, email } = args.input;

            //Sacado de: https://docs.deno.com/examples/hashing/
            const hashedPassword = await encodeHex(password);

            const user = await ctx.UsersCollection.findOne({  _id: new ObjectId(id) });
            if(!user) throw new GraphQLError("User not found");
            const updatedUser = await ctx.UsersCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { name, password: hashedPassword, email } });
            return updatedUser;
        },

        deleteUser: async (_: unknown, args: { id: string }, ctx: userCtx) => {
            const user = await ctx.UsersCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
            if(!user) throw new GraphQLError("User not found");
        },


        createPost: async (_: unknown, args: CreatePostInput, ctx: userPostCtx) => {
            const { userId } = args;
            const { content } = args.input;

            const user = await ctx.UsersCollection.findOne({  _id: new ObjectId(userId) });
            if(!user) throw new GraphQLError("User not found");

            const post = await ctx.PostsCollection.insertOne({
              content,
              comments: [],
              author: user._id,
              likes: []
            });

            return {
                _id: post.insertedId,
                content,
                comments: [],
                author: user._id,
                likes: []
            }  
        },

        updatePost: async (_: unknown, args: UpdatePostInput, ctx: postCtx) => {
            const { id } = args;
            const { content } = args.input;

            const post = await ctx.PostsCollection.findOne({  _id: new ObjectId(id) });
            if(!post) throw new GraphQLError("Post not found");
            const updatedPost = await ctx.PostsCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { content } });
            return updatedPost;
        },

        deletePost: async (_: unknown, args: { id: string }, ctx: postCtx) => {
            const post = await ctx.PostsCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
            if(!post) throw new GraphQLError("Post not found");
        },


        addLikeToPost: async (_: unknown, args: AddLikeToPostArgs, ctx: userPostCtx) => {
            const { postId, userId } = args;

            const post = await ctx.PostsCollection.findOne({  _id: new ObjectId(postId) });
            if(!post) throw new GraphQLError("Post not found");

            const user = await ctx.UsersCollection.findOne({  _id: new ObjectId(userId) });
            if(!user) throw new GraphQLError("User not found");

            await ctx.PostsCollection.updateOne({  _id: new ObjectId(postId) }, { $push: { likes: new ObjectId(userId) } });
            return post;
        },

        removeLikeFromPost: async (_: unknown, args: AddLikeToPostArgs, ctx: userPostCtx) => {
            const { postId, userId } = args;

            const post = await ctx.PostsCollection.findOne({  _id: new ObjectId(postId) });
            if(!post) throw new GraphQLError("Post not found");

            const user = await ctx.UsersCollection.findOne({  _id: new ObjectId(userId) });
            if(!user) throw new GraphQLError("User not found");

            await ctx.PostsCollection.updateOne({  _id: new ObjectId(postId) }, { $pull: { likes: new ObjectId(userId) } });
            return post;
        },


        createComment: async (_: unknown, args: CreateCommentInput, ctx: fullContext) => {
            const { userId, postId } = args;
            const { text } = args.input;

            const user = await ctx.UsersCollection.findOne({  _id: new ObjectId(userId) });
            if(!user) throw new GraphQLError("User not found");

            const post = await ctx.PostsCollection.findOne({  _id: new ObjectId(postId) });
            if(!post) throw new GraphQLError("Post not found");

            const comment = await ctx.CommentsCollection.insertOne({
              text,
              author: user._id,
              post: post._id
            });

            return {
                _id: comment.insertedId,
                text,
                author: user._id,
                post: post ._id
            }
        },

        updateComment: async (_: unknown, args: UpdateCommentInput, ctx: commentCtx) => {
            const { id } = args;
            const { text } = args.input;

            const comment = await ctx.CommentsCollection.findOne({  _id: new ObjectId(id) });
            if(!comment) throw new GraphQLError("Comment not found");
            const updatedComment = await ctx.CommentsCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { text } });
            return updatedComment;
        },

        deleteComment: async (_: unknown, args: { id: string }, ctx: commentCtx) => {
            const comment = await ctx.CommentsCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
            if(!comment) throw new GraphQLError("Comment not found");
        }
    }
}
