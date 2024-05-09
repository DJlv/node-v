## 线程
### 自定义线程池
:::details 阻塞队列定义
```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.locks.Condition;

public class BlockingQueue<T> {
    // 1.队列 使用双向列表
    private Deque<T> queue = new ArrayDeque<>();
    // 2.添加锁
    private ReentrantLock lock = new ReentrantLock();
    // 3.生产者条件变量
    private Condition fillWaitSet = lock.newCondition();
    // 4.消费者条件变量
    private Condition emptyWaitSet = lock.newCondition();
    // 5.容量
    private int capcity;

    // 6.阻塞获取
    public T take() throws InterruptedException {
        // 先添加锁
        lock.lock();
        try {
            // 容量不足
            while (queue.isEmpty()) {
                // 阻塞消费者
                emptyWaitSet.await();
            }
            // 取出元素
            T t = queue.removeFirst();
            // 通知生产者
            fillWaitSet.signal();
            return t;
        } finally {
            // 释放锁
            lock.unlock();
        }

    }

    // 7.阻塞添加
    public void put(T t) throws InterruptedException {
        // 先添加锁
        lock.lock();
        try {
            // 容量不足
            while (queue.size() == capcity) {
                // 阻塞生产者
                fillWaitSet.await();
            }
            // 添加元素
            queue.addLast(t);
            // 通知消费者
            emptyWaitSet.signal();
        } finally {
            // 释放锁
            lock.unlock();
        }
    }

    // 8.获取队列大小
    public int size() {
        lock.lock();
        try {
            return queue.size();
        } finally {
            lock.unlock();
        }
    }

    // 9.设置容量
    public void setCapacity(int capcity) {
        lock.lock();
        try {
            this.capcity = capcity;
        } finally {
            lock.unlock();
        }
    }
    // 10.超时获取
    public T poll(long timeout, TimeUnit unit) throws InterruptedException {
        // 先添加锁
        lock.lock();
        try {
            long nanos = unit.toNanos(timeout);
            // 容量不足
            while (queue.isEmpty()) {
                //  阻塞消费者 返回剩余时间
                if (nanos <= 0) {
                    return null;
                }
                nanos = emptyWaitSet.awaitNanos(nanos);
            }
            // 取出元素
            T t = queue.removeFirst();
            // 通知生产者
            fillWaitSet.signal();
            return t;
        } finally {
            // 释放锁
            lock.unlock();
        }
    }
}
```
:::