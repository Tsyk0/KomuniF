// src/entity/conversation-member.ts
export interface ConversationMember {
    id: number;                     // 主键ID
    convId: number;                 // 会话ID
    userId: number;                 // 用户ID
    memberNickname: string | null;  // 群内昵称
    memberRole: number;             // 0-普通成员，1-管理员，2-群主
    memberStatus: number;           // 0-已退出，1-正常，2-禁言
    privateDisplayName: string | null; // 单聊时的对方昵称和多聊时的设置的群名称
    lastReadTime: string | null;    // 最后阅读时间
    lastSpeakTime: string | null;   // 最后发言时间
    joinTime: string;               // 加入时间
    updateTime: string;             // 更新时间
    unreadCount: number;            // 未读消息数
}

// 成员角色枚举
export enum MemberRole {
    NORMAL = 0,     // 普通成员
    ADMIN = 1,      // 管理员
    OWNER = 2       // 群主
}

// 成员状态枚举
export enum MemberStatus {
    QUIT = 0,       // 已退出
    NORMAL = 1,     // 正常
    MUTED = 2       // 禁言
}