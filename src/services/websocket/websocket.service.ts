// src/services/websocket/websocket.service.ts

/**
 * WebSocket服务 - 基础版 + 心跳
 * 功能：连接、断开、发送消息、接收消息、心跳保持
 */
export class WebSocketService {
  // WebSocket连接实例
  private ws: WebSocket | null = null;
  
  // 心跳定时器ID
  private heartbeatTimer: number | null = null;
  
  // 心跳配置
  private readonly HEARTBEAT_INTERVAL = 30000; // 30秒发送一次ping
  private readonly HEARTBEAT_TIMEOUT = 10000;  // 10秒没收到pong认为超时
  private lastPongTime: number = 0;
  
  // 连接状态
  private isConnecting: boolean = false;
  
  // 消息处理器
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  /**
   * 1. 连接WebSocket
   */
  async connect(): Promise<boolean> {
    // 防止重复连接
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket已在连接或已连接');
      return true;
    }
    
    this.isConnecting = true;
    
    return new Promise((resolve) => {
      try {
        // 同源连接，浏览器才会自动带 Cookie（代理会把 /ws 转到后端）
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws`;
        console.log('正在连接WebSocket:', url);
        
        // 创建WebSocket连接
        this.ws = new WebSocket(url);
        
        // 设置事件监听器
        this.setupEventListeners(resolve);
        
      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }
  
  /**
   * 2. 设置WebSocket事件监听器
   */
  private setupEventListeners(resolve: (success: boolean) => void): void {
    if (!this.ws) {
      resolve(false); // 如果ws不存在，直接返回失败
      return;
    }
    
    // 连接成功
    this.ws.onopen = () => {
      console.log('WebSocket连接成功');
      this.isConnecting = false;
      
      // 启动心跳机制
      this.startHeartbeat();
      
      // 触发连接成功回调
      this.triggerMessageHandler('connected', { success: true });
      
      resolve(true);
    };
    
    // 连接失败
    this.ws.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
      this.isConnecting = false;
      this.cleanup();
      resolve(false);
    };
    
    // 收到消息
    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
    
    // 连接关闭
    this.ws.onclose = (event) => {
      console.log('WebSocket连接关闭:', event.code, event.reason);
      this.isConnecting = false;
      this.cleanup();
      
      // 触发断开连接回调
      this.triggerMessageHandler('disconnected', { 
        code: event.code, 
        reason: event.reason 
      });
    };
  }
  
  /**
   * 3. 处理收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('收到WebSocket消息:', data);
      
      // 处理心跳响应（pong）
      if (data.action === 'pong') {
        this.lastPongTime = Date.now();
        console.log('收到pong响应，连接正常');
        return;
      }
      
      // 处理连接成功响应（从服务器来的确认）
      if (data.action === 'connected') {
        console.log('服务器确认连接成功，用户ID:', data.userId, '订阅会话:', data.subscriptions);
      }
      
      // 分发消息给对应的处理器
      if (this.messageHandlers.has(data.action)) {
        const handler = this.messageHandlers.get(data.action)!;
        handler(data);
      } else {
        // 如果没有特定处理器，使用通用处理器
        this.triggerMessageHandler('message', data);
      }
      
    } catch (error) {
      console.error('解析WebSocket消息失败:', error, '原始数据:', event.data);
    }
  }
  
  /**
   * 4. 发送文本消息
   */
  sendTextMessage(convId: number, content: string): boolean {
    // 检查连接状态
    if (!this.isConnected()) {
      console.error('发送失败：WebSocket未连接');
      return false;
    }
    
    try {
      const message = {
        action: 'sendMessage' as const,
        convId,
        messageType: 'text' as const,
        messageContent: content,
        timestamp: Date.now()
      };
      
      console.log('发送消息:', message);
      this.ws!.send(JSON.stringify(message));
      return true;
      
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }
  
  /**
   * 5. 启动心跳机制
   */
  private startHeartbeat(): void {
    // 先停止可能存在的旧定时器
    this.stopHeartbeat();
    
    // 初始化最后pong时间
    this.lastPongTime = Date.now();
    
    // 设置定时发送ping
    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
    
    console.log('心跳机制已启动，间隔:', this.HEARTBEAT_INTERVAL, 'ms');
  }
  
  /**
   * 发送心跳ping
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      console.warn('发送心跳失败：连接已断开');
      return;
    }
    
    // 检查是否超时（太久没收到pong）
    const now = Date.now();
    const timeSinceLastPong = now - this.lastPongTime;
    
    if (timeSinceLastPong > this.HEARTBEAT_TIMEOUT) {
      console.error('心跳超时，最后收到pong是在', timeSinceLastPong, 'ms前');
      this.triggerMessageHandler('heartbeat_timeout', { timeSinceLastPong });
      return;
    }
    
    // 发送ping消息
    try {
      const pingMessage = {
        action: 'ping' as const,
        timestamp: now
      };
      
      console.log('发送心跳ping');
      this.ws!.send(JSON.stringify(pingMessage));
      
    } catch (error) {
      console.error('发送心跳失败:', error);
    }
  }
  
  /**
   * 停止心跳机制
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      console.log('心跳机制已停止');
    }
  }
  
  /**
   * 6. 断开连接
   */
  disconnect(): void {
    console.log('正在断开WebSocket连接...');
    
    // 停止心跳
    this.stopHeartbeat();
    
    // 关闭WebSocket连接
    if (this.ws) {
      // 1000是正常关闭的状态码
      this.ws.close(1000, '用户主动断开');
      this.ws = null;
    }
    
    // 清理状态
    this.cleanup();
    console.log('WebSocket连接已断开');
  }
  
  /**
   * 清理资源
   */
  private cleanup(): void {
    this.isConnecting = false;
    this.lastPongTime = 0;
  }
  
  /**
   * 7. 注册消息处理器
   */
  onMessage(action: string, handler: (data: any) => void): void {
    this.messageHandlers.set(action, handler);
  }
  
  /**
   * 移除消息处理器
   */
  offMessage(action: string): void {
    this.messageHandlers.delete(action);
  }
  
  /**
   * 触发消息处理器
   */
  private triggerMessageHandler(event: string, data: any): void {
    if (this.messageHandlers.has(event)) {
      const handler = this.messageHandlers.get(event)!;
      handler(data);
    }
  }
  
  /**
   * 8. 工具方法：检查连接状态
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  /**
   * 获取连接状态描述
   */
  getConnectionState(): string {
    if (!this.ws) return '未连接';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return '连接中';
      case WebSocket.OPEN:
        return '已连接';
      case WebSocket.CLOSING:
        return '正在关闭';
      case WebSocket.CLOSED:
        return '已断开';
      default:
        return '未知状态';
    }
  }
}