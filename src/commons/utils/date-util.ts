// src/commons/utils/date-util.ts

import dayjs from 'dayjs';

/**
 * 格式化消息时间显示
 * 规则：
 * 1. 当天消息：显示时间（HH:mm）
 * 2. 昨天消息：显示 "昨天 HH:mm"
 * 3. 当年消息：显示月日+时间（MM-DD HH:mm）
 * 4. 更早消息：显示年月日+时间（YYYY-MM-DD HH:mm）
 * 
 * @param timeString 时间字符串，格式如 "2026-01-20T10:30:00"
 * @returns 格式化后的时间字符串
 */
export function formatMessageTime(timeString: string): string {
  if (!timeString) return '';
  
  const messageTime = dayjs(timeString);
  const now = dayjs();
  
  // 当天
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm');
  }
  
  // 昨天
  const yesterday = now.subtract(1, 'day');
  if (messageTime.isSame(yesterday, 'day')) {
    return `昨天 ${messageTime.format('HH:mm')}`;
  }
  
  // 当年
  if (messageTime.isSame(now, 'year')) {
    return messageTime.format('MM-DD HH:mm');
  }
  
  // 更早
  return messageTime.format('YYYY-MM-DD HH:mm');
}

/**
 * 用于会话列表的简短时间显示
 * 规则：
 * 1. 当天消息：显示时间（HH:mm）
 * 2. 昨天消息：显示 "昨天"
 * 3. 一周内：显示星期几（周一、周二等）
 * 4. 更早：显示月日（MM-DD）
 * 
 * @param timeString 时间字符串
 * @returns 简短格式的时间字符串
 */
export function formatConversationTime(timeString: string): string {
  if (!timeString) return '';
  
  const messageTime = dayjs(timeString);
  const now = dayjs();
  
  // 当天
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm');
  }
  
  // 昨天
  const yesterday = now.subtract(1, 'day');
  if (messageTime.isSame(yesterday, 'day')) {
    return '昨天';
  }
  
  // 一周内
  const weekAgo = now.subtract(7, 'day');
  if (messageTime.isAfter(weekAgo)) {
    const dayOfWeek = messageTime.day();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[dayOfWeek];
  }
  
  // 当年
  if (messageTime.isSame(now, 'year')) {
    return messageTime.format('MM-DD');
  }
  
  // 更早
  return messageTime.format('YY-MM-DD');
}