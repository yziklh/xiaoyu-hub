use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// 已处理指令 ACK 记录
#[derive(Clone, Debug)]
pub struct AckRecord {
    pub status: String,
    pub message: String,
}

/// 指令幂等：同一 requestId 只执行一次
#[derive(Clone)]
pub struct IdempotencyStore {
    inner: Arc<Mutex<HashMap<String, AckRecord>>>,
    max_size: usize,
}

impl IdempotencyStore {
    pub fn new(max_size: usize) -> Self {
        Self {
            inner: Arc::new(Mutex::new(HashMap::new())),
            max_size,
        }
    }

    /// 若已处理则返回历史 ACK
    pub fn get(&self, request_id: &str) -> Option<AckRecord> {
        if request_id.is_empty() {
            return None;
        }
        self.inner.lock().unwrap().get(request_id).cloned()
    }

    /// 抢占 requestId，防止并发重复执行
    pub fn try_claim(&self, request_id: &str) -> bool {
        if request_id.is_empty() {
            return true;
        }
        let mut map = self.inner.lock().unwrap();
        if map.contains_key(request_id) {
            return false;
        }
        if map.len() >= self.max_size {
            map.clear();
        }
        map.insert(
            request_id.to_string(),
            AckRecord {
                status: "PROCESSING".to_string(),
                message: "处理中".to_string(),
            },
        );
        true
    }

    /// 记录已处理指令
    pub fn remember(&self, request_id: &str, status: &str, message: &str) {
        if request_id.is_empty() {
            return;
        }
        let mut map = self.inner.lock().unwrap();
        if map.len() >= self.max_size {
            // 超出容量时清空，避免长期运行内存膨胀
            map.clear();
        }
        map.insert(
            request_id.to_string(),
            AckRecord {
                status: status.to_string(),
                message: message.to_string(),
            },
        );
    }
}
