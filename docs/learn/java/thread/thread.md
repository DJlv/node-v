## 1. 线程
### 1.1. 创建和运行线程
#### 1.1.1. 直接使用 Thread
```java
// 创建线程对象
Thread t = new Thread() {
 public void run() {
 // 要执行的任务
 }
};
// 启动线程
t.start();
```
#### 1.1.2. 使用 Runnable 配合 Thread
* 把【线程】和【任务】（要执行的代码）分开
  * Thread 代表线程
  * Runnable 可运行的任务（线程要执行的代码）
```java
Runnable runnable = new Runnable() {
 public void run(){
 // 要执行的任务
 }
};
// 创建线程对象
Thread t = new Thread( runnable );
// 启动线程
t.start();
```
<font  color=33FF33>原理之 Thread 与 Runnable 的关系</font> 
   * 小结
     * 方法1 是把线程和任务合并在了一起，方法2 是把线程和任务分开了
     * 用 Runnable 更容易与线程池等高级 API 配合
     * 用 Runnable 让任务类脱离了 Thread 继承体系，更灵活
  
#### 1.1.3. FutureTask 配合 Thread
FutureTask 能够接收 Callable 类型的参数，用来处理有返回结果的情况
```java
// 创建任务对象
FutureTask<Integer> task3 = new FutureTask<>(() -> {
 log.debug("hello");
 return 100;
});
// 参数1 是任务对象; 参数2 是线程名字，推荐
new Thread(task3, "t3").start();
// 主线程阻塞，同步等待 task 执行完毕的结果
Integer result = task3.get();
log.debug("结果是:{}", result);
```

