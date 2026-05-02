import { useConvStore } from "@/store/conv/conv";
import { useFriendStore } from "@/store/friend/showFriend";

/**
 * 将好友备注与分组回写到 Pinia（好友列表、当前详情、关联单聊的 privateDisplayName）。
 * 使用场景：`conversationInfoStore.updateFriendRemark` 成功后，与 SingleConvInfo / FriendInfo 保持一致的本地同步。
 */
export function syncFriendRemarkToStores(
  targetFriendId: number,
  nextRemarkTrimmed: string,
  nextGroupTrimmed: string
): void {
  const friendStore = useFriendStore();
  const conversationStore = useConvStore();
  const normalizedRemark = nextRemarkTrimmed === "" ? null : nextRemarkTrimmed;
  const normalizedGroup = nextGroupTrimmed === "" ? null : nextGroupTrimmed;

  if (
    friendStore.currentFriend &&
    Number(friendStore.currentFriend.friendId) === targetFriendId
  ) {
    friendStore.currentFriend = {
      ...friendStore.currentFriend,
      remarkName: normalizedRemark,
      group: normalizedGroup,
      displayName:
        normalizedRemark || friendStore.currentFriend.nickname || "未知用户",
    };
  }

  friendStore.friends = friendStore.friends.map((friend) =>
    Number(friend.friendId) === targetFriendId
      ? {
          ...friend,
          remarkName: normalizedRemark,
          group: normalizedGroup,
          displayName: normalizedRemark || friend.nickname || "未知用户",
        }
      : friend
  );

  conversationStore.conversations
    .filter((conv) => {
      if (Number(conv.convType) !== 1) return false;
      const peerId = Number(conv.peer?.peerUserId || conv.targetUserId || 0);
      return peerId === targetFriendId;
    })
    .forEach((conv) => {
      conversationStore.patchConversationLocal(conv.convId, {
        privateDisplayName: normalizedRemark,
      });
    });
}
