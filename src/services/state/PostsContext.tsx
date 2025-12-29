import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  fetchPostsByService,
  createPost,
  likePost,
  commentOnPost,
  Post,
} from "../services/posts";

/**
 * PostsContext
 *
 * Manages posts (work feed) for a particular service. Keeps track
 * of the posts array and provides helper functions to create a new
 * post, like a post, or comment on it. Accepts a `serviceId` prop
 * for scoping.
 */

interface PostsState {
  posts: Post[];
  loading: boolean;
  loadPosts: () => Promise<void>;
  addPost: (payload: {
    imageUrl: string;
    description?: string;
  }) => Promise<Post>;
  like: (postId: string) => Promise<void>;
  comment: (postId: string, comment: string) => Promise<void>;
}

const PostsContext = createContext<PostsState | undefined>(undefined);

export const PostsProvider = ({
  children,
  serviceId,
}: {
  children: ReactNode;
  serviceId: string;
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPostsByService(serviceId);
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  const addPost = async (payload: {
    imageUrl: string;
    description?: string;
  }) => {
    const newPost = await createPost(serviceId, payload);
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const like = async (postId: string) => {
    const { likes } = await likePost(postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes } : p))
    );
  };

  const comment = async (postId: string, commentText: string) => {
    const { commentsCount } = await commentOnPost(postId, commentText);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount } : p))
    );
  };

  // useEffect(() => {
  //   loadPosts().catch((err) => console.error(err));
  // }, [serviceId]);

  const value: PostsState = {
    posts,
    loading,
    loadPosts,
    addPost,
    like,
    comment,
  };

  return (
    <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
};
