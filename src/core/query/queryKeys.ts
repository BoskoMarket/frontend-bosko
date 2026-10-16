export const QUERY_KEYS = {
  profile:          ['profile']                                          as const,
  profileStats:     ['profile', 'stats']                                 as const,
  publicUser:       (id: string) => ['users', id]                        as const,

  categories:       ['categories']                                       as const,
  services:         (categoryId: string, page = 1) =>
                      ['services', categoryId, page]                     as const,
  featuredServices: ['services', 'featured']                             as const,
  myServices:       ['services', 'me']                                   as const,
  serviceById:      (id: string) => ['services', id]                     as const,
  providerProfile:  (id: string) => ['providers', id]                    as const,
  serviceReviews:   (id: string) => ['reviews', 'service', id]           as const,
  servicePosts:     (id: string) => ['posts', id]                        as const,

  clientOrders:     ['orders', 'client']                                 as const,
  providerOrders:   ['orders', 'provider']                               as const,
  myPlan:           ['plans', 'my']                                      as const,
  orderById:        (id: string) => ['orders', id]                       as const,

  paymentHistory:   (page = 1) => ['payments', 'history', page]          as const,
  earnings:         (page = 1) => ['payments', 'earnings', page]          as const,
  orderPayment:     (orderId: string) => ['payments', 'order', orderId]   as const,

  conversations:    ['conversations']                                    as const,
  conversationByOrder: (orderId: string) =>
                      ['conversations', 'order', orderId]                as const,
  messages:         (convId: string, page = 1) =>
                      ['messages', convId, page]                         as const,

  notifications:    (page = 1) => ['notifications', page]                as const,
  unreadCount:      ['notifications', 'unread']                          as const,

  kycStatus:        ['kyc', 'status']                                    as const,

  reelsFeed:        (page = 1) => ['reels', page]                        as const,

  search:           (query: string) => ['search', query]                 as const,

  appConfig:        ['app', 'config']                                    as const,
} as const;
