/** Photo of a finished job published by a provider ("Trabajos"). */
export interface WorkPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  description: string | null;
  createdAt: string;
  likes: number;
}

export interface WorkService {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
}

export interface WorkProvider {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number | null;
  isVerified: boolean;
}

/** Item of the public feed (`GET /posts/feed`): the photo plus its service and provider. */
export interface WorkFeedItem extends WorkPhoto {
  service: WorkService;
  provider: WorkProvider;
}

/** One cursor page: `nextCursor` is opaque and null on the last page. */
export interface WorksFeedPage {
  data: WorkFeedItem[];
  nextCursor: string | null;
}

export interface WorkImageFile {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}
