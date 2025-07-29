import { useEffect, useState, useCallback, useMemo } from "react";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { supabase } from "$/supabase/client";
import { Notification } from "$/types/data.types";
import { dedupedRequest, normalizeEntity } from "@/utils/queryOptimizer";
import { log, logError, logWarning } from "@/utils/sentryUtils";

// Define the sender type properly
interface UserProfile {
  id: string;
  avatar_url?: string;
  username?: string;
  [key: string]: any;
}

// Extended notification type with proper sender type
interface NotificationWithSender extends Omit<Notification, "sender"> {
  sender?: UserProfile;
}

// Define the page structure
interface NotificationPage {
  notifications: NotificationWithSender[];
  hasMore: boolean;
  totalCount: number;
}

// Optimized notifications hook with pagination and caching
export const useNotifications = (userId: string | null) => {
  const queryClient = useQueryClient();
  const pageSize = 10;

  // Use infinite query for efficient pagination
  const query = useInfiniteQuery<NotificationPage, Error>({
    queryKey: ["notifications", userId],
    queryFn: async ({ pageParam = 0 }) => {
      // console.log(
      //   "Fetching notifications for userId:",
      //   userId,
      //   "page:",
      //   pageParam
      // );
      const currentPage = typeof pageParam === "number" ? pageParam : 0;

      if (!userId) {
        return {
          notifications: [],
          hasMore: false,
          totalCount: 0,
        };
      }

      // Use request deduplication
      return dedupedRequest(
        `notifications-${userId}-${currentPage}`,
        async () => {
          // Get total count with same media filtering for consistency
          const countResponse = await supabase
            .from("notifications")
            .select(`
              id,
              posts!inner(
                id,
                ipfsImages,
                video_data
              )
            `, { count: "exact", head: true })
            .eq("user_id", userId)
            .neq("sender_id", userId)
            .or("posts.ipfsImages.not.is.null,posts.video_data.not.is.null");

          const totalCount = countResponse.count || 0;
          // console.log("Total notification count:", totalCount);

          // Get notifications with post media filtering to ensure consistency
          const { data, error } = await supabase
            .from("notifications")
            .select(`
              *,
              posts!inner(
                id,
                ipfsImages,
                video_data,
                media_type
              )
            `)
            .eq("user_id", userId)
            .neq("sender_id", userId)
            .or("posts.ipfsImages.not.is.null,posts.video_data.not.is.null")
            .order("created_at", { ascending: false });

          // console.log("Notifications query:", {
          //   userId,
          //   range: [currentPage * pageSize, (currentPage + 1) * pageSize - 1],
          // });
          // console.log("Supabase notifications data:", data);
          // console.log("Supabase error:", error);

          if (error) {
            logError("Supabase error fetching notifications", error);
            throw error;
          }

          if (!data || !Array.isArray(data)) {
            // logWarning("No data received from notifications query or data is not an array");
            return {
              notifications: [],
              hasMore: false,
              totalCount,
            };
          }

          //log("Received", { count: data.length, notificationsType: "notifications" });

          // Handle data safely
          const notificationsWithSenders: NotificationWithSender[] = [];

          if (data && Array.isArray(data)) {
            // Process each notification and fetch sender data as needed
            for (const notification of data) {
              // log("Processing notification", notification);

              // Create a safe copy without modifying the original
              const notificationCopy: NotificationWithSender = {
                ...notification,
                sender: undefined,
              };

              // If we have a sender_id, fetch the profile data
              if (notification.sender_id) {
                try {
                  const { data: senderData, error: senderError } =
                    await supabase
                      .from("profiles")
                      .select("*")
                      .eq("id", notification.sender_id)
                      .single();

                  if (!senderError && senderData) {
                    // Create a simpler user profile object with just the required fields
                    notificationCopy.sender = {
                      id: senderData.id,
                      // Ensure these are not null
                      avatar_url: senderData.avatar_url || undefined,
                      // Add display_name as username if available
                      username: senderData.display_name || undefined,
                    };

                    // Store the user data in cache with just the id
                    if (senderData.id) {
                      normalizeEntity("users", { id: senderData.id });
                    }
                  } else {
                    logWarning("Could not fetch sender profile", senderError);
                  }
                } catch (err) {
                  logError("Error fetching sender profile", err);
                }
              }

              // Store the notification in cache (without sender to avoid issues)
              const { sender, ...notificationData } = notificationCopy;
              if (notificationData.id) {
                normalizeEntity(
                  "comments",
                  notificationData as { id: string | number }
                );
              }

              // Add to our processed list
              notificationsWithSenders.push(notificationCopy);
            }
          }

          // log("Processed notifications", notificationsWithSenders);
          const hasMore = (currentPage + 1) * pageSize < totalCount;

          return {
            notifications: notificationsWithSenders,
            hasMore,
            totalCount,
          };
        }
      );
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });

  // For debugging: log when the component mounts and when data changes
  useEffect(() => {
    // log("Notifications hook mounted for userId", userId);
    return () => {
      // log("Notifications hook unmounted for userId", userId);
    };
  }, [userId]);

  useEffect(() => {
    // log("Current notification data", query.data);
  }, [query.data]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Selective cache update instead of full invalidation
          if (payload.eventType === "INSERT") {
            // Add new notification to cache
            queryClient.setQueryData(["notifications", userId], (old: any) => {
              if (!old || !old.pages || !old.pages.length) return old;

              // Clone the first page
              const newPages = [...old.pages];
              const firstPage = { ...newPages[0] };

              // Add the new notification
              firstPage.notifications = [
                payload.new as NotificationWithSender,
                ...firstPage.notifications,
              ];

              // Update counts
              firstPage.totalCount = (firstPage.totalCount || 0) + 1;

              // Replace the first page
              newPages[0] = firstPage;

              return {
                ...old,
                pages: newPages,
              };
            });
          } else {
            // For updates and deletes, do a full invalidation
            queryClient.invalidateQueries({
              queryKey: ["notifications", userId],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Flatten paginated data
  const notifications = useMemo(() => {
    if (!query.data) return [];

    // Safely access the notifications from each page
    return query.data.pages.flatMap((page) => page.notifications || []);
  }, [query.data]);

  // Get total unread count
  const totalUnread = useMemo(() => {
    if (!query.data || !query.data.pages.length) return 0;

    // Safely access the totalCount from the first page
    return query.data.pages[0]?.totalCount || 0;
  }, [query.data]);

  // Load more helper
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    notifications,
    totalUnread,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore,
    refetch: query.refetch,
  };
};

// Optimized hook for just counting unread notifications
export const useUnreadNotificationsCount = (userId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch the initial count
  const query = useQuery<number, Error>({
    queryKey: ["notificationsCount", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      // log(
      //   "[useUnreadNotificationsCount] Fetching count for userId",
      //   { userId }
      // );

      // Use deduplication for count queries
      return dedupedRequest(`notifications-count-${userId}`, async () => {
        // Use exactly the same filters as the main notifications query
        const { count, error } = await supabase
          .from("notifications")
          .select(`
            *,
            posts!inner(
              id,
              ipfsImages,
              video_data
            )
          `, { count: "exact", head: true })
          .eq("user_id", userId)
          .neq("sender_id", userId)
          .eq("is_read", false)
          .or("posts.ipfsImages.not.is.null,posts.video_data.not.is.null");

        if (error) {
          logError("[useUnreadNotificationsCount] Error fetching count", error);
          throw error;
        }

        // log("[useUnreadNotificationsCount] Count result", { count });
        return count || 0;
      });
    },
    staleTime: 1000 * 15, // 15 seconds - keep very fresh
    refetchInterval: 10000, // Poll every 10 seconds as backup
    enabled: !!userId,
  });

  // Add real-time subscription for unread count updates
  useEffect(() => {
    if (!userId) return;

    // log(
    //   "[useUnreadNotificationsCount] Setting up real-time subscription"
    // );

    // Create a channel specifically for this hook to avoid conflicts
    const channel = supabase
      .channel(`unread-count-hook-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // log(
          //   "[useUnreadNotificationsCount] Received change",
          //   payload
          // );

          // For any change to notifications table, immediately refetch the count
          // This ensures the count is always accurate after any operation
          queryClient.invalidateQueries({
            queryKey: ["notificationsCount", userId],
          });
        }
      )
      .subscribe((status) => {
        // log(
        //   `[useUnreadNotificationsCount] Subscription status`,
        //   { status }
        // );
      });

    return () => {
      //log("[useUnreadNotificationsCount] Removing channel");
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const count = query.data || 0;

  // Log every time the count changes
  // useEffect(() => {
  //  // log("[useUnreadNotificationsCount] Current count", { count });
  // }, [count]);

  return count;
};

// Optimized hook for counting share notifications for a specific post
export const useCountShareNotifications = (post_id: number | null) => {
  const queryClient = useQueryClient();

  const query = useQuery<number, Error>({
    queryKey: ["shareNotificationsCount", post_id],
    queryFn: async (): Promise<number> => {
      if (!post_id) return 0;

      // Use deduplication for count queries
      return dedupedRequest(
        `share-notifications-count-${post_id}`,
        async () => {
          const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post_id)
            .eq("type", "share"); // Add type filter to only count share notifications

          if (error) throw error;
          return count || 0;
        }
      );
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    enabled: !!post_id,
  });

  // Set up real-time subscription for live updates
  useEffect(() => {
    if (!post_id) return;

    const channel = supabase
      .channel(`share-notifications-${post_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `post_id=eq.${post_id} AND type=eq.share`,
        },
        () => {
          // Optimistic increment for better UX
          queryClient.setQueryData(
            ["shareNotificationsCount", post_id],
            (oldCount: number | undefined) => (oldCount || 0) + 1
          );

          // Still invalidate to get actual data
          queryClient.invalidateQueries({
            queryKey: ["shareNotificationsCount", post_id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post_id, queryClient]);

  // Helper for incrementing count optimistically
  const incrementShareCount = useCallback(() => {
    if (!post_id) return;

    queryClient.setQueryData(
      ["shareNotificationsCount", post_id],
      (oldCount: number | undefined) => (oldCount || 0) + 1
    );
  }, [post_id, queryClient]);

  return {
    shareCount: query.data || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    incrementShareCount,
  };
};
