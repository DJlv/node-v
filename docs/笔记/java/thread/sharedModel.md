# 共享模型--管程
## 1. 临界区 Critical Section
* 一个程序运行多个线程本身是没有问题的
* 问题出在多个线程访问共享资源
  * 多个线程读共享资源其实也没有问题
  * 在多个线程对共享资源读写操作时发生指令交错，就会出现问题
* 一段代码块内如果存在对共享资源的多线程读写操作，称这段代码块为临界区
## 2. 竞态条件 Race Condition
* 多个线程在临界区内执行，由于代码的执行序列不同而导致结果无法预测，称之为发生了竞态条件 
## 3. 解决方案
### 3.1. synchronized 解决方案
<font  color=33FF33>为了避免临界区的竞态条件发生 </font>   

* 阻塞式的解决方案：synchronized，Lock
  * synchronized，来解决上述问题，即俗称的【对象锁】，它采用互斥的方式让同一时刻至多只有一个线程能持有【对象锁】，其它线程再想获取这个【对象锁】时就会阻塞住。这样就能保证拥有锁的线程可以安全的执行临界区内的代码，不用担心线程上下文切换.
  ::: tip **
  虽然 java 中互斥和同步都可以采用 synchronized 关键字来完成，但它们还是有区别的：
  * 互斥是保证临界区的竞态条件发生，同一时刻只能有一个线程执行临界区代码
  * 同步是由于线程执行的先后、顺序不同、需要一个线程等待其它线程运行到某个点  
  synchronized 实际是用对象锁保证了临界区内代码的原子性，临界区内的代码对外是不可分割的，不会被线程切换所打断。
  :::
* 非阻塞式的解决方案：原子变量
## 4. 变量的线程安全分析
### 4.1. 成员变量和静态变量是否线程安全？
* 如果它们没有共享，则线程安全
* 如果它们被共享了，根据它们的状态是否能够改变，又分两种情况
  * 如果只有读操作，则线程安全
  * 如果有读写操作，则这段代码是临界区，需要考虑线程安全
### 4.2. 局部变量是否线程安全？
* 局部变量是线程安全的
* 但局部变量引用的对象则未必
  * 如果该对象没有逃离方法的作用访问，它是线程安全的
  * 如果该对象逃离方法的作用范围，需要考虑线程安全
### 4.3. 常见线程安全类
::: tip  常见线程安全类
String Integer StringBuffer Random Vector Hashtable java.util.concurrent 包下的类

这里说它们是线程安全的是指，多个线程调用它们同一个实例的某个方法时，是线程安全的
它们的每个方法是原子的
但注意它们多个方法的组合不是原子的
:::
### 4.4. wait / notify
#### 4.4.1. API 介绍
* obj.wait() 让进入 object 监视器的线程到 waitSet 等待
* obj.notify() 在 object 上正在 waitSet 等待的线程中挑一个唤醒
* obj.notifyAll() 让 object 上正在 waitSet 等待的线程全部唤醒
  ::: tip 
  wait() 方法会释放对象的锁，进入 WaitSet 等待区，从而让其他线程就机会获取对象的锁。无限制等待，直到notify 为止  
  wait(long n) 有时限的等待, 到 n 毫秒后结束等待，或是被 notify
  :::
::: tip  sleep(long n) 和 wait(long n) 的区别
1) sleep 是 Thread 方法，而 wait 是 Object 的方法 
2) sleep 不需要强制和 synchronized 配合使用，但 wait 需要
和 synchronized 一起用 
3) sleep 在睡眠的同时，不会释放对象锁的，但 wait 在等待的时候会释放对象锁 
4) 它们
状态 TIMED_WAITING
:::

::: tip 1
notify 只能随机唤醒一个 WaitSet 中的线程，这时如果有其它线程也在等待，那么就可能唤醒不了正确的线程，称之为【虚假唤醒】  
解决方法，改为 notifyAll
:::
::: tip 2
用 notifyAll 仅解决某个线程的唤醒问题，但使用 if + wait 判断仅有一次机会，一旦条件不成立，就没有重新判断的机会了  
解决方法，用 while + wait，当条件不成立，再次 wait
:::
### 4.5. Park & Unpark
#### 4.5.1. 与 Object 的 wait & notify 相比
* wait，notify 和 notifyAll 必须配合 Object Monitor 一起使用，而 park，unpark 不必
* park & unpark 是以线程为单位来【阻塞】和【唤醒】线程，而 notify 只能随机唤醒一个等待线程，notifyAll 是唤醒所有等待线程，就不那么【精确】
* park & unpark 可以先 unpark，而 wait & notify 不能先 notify