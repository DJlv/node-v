
# 1. 进程与线程
## 1.1. 进程
* 程序由指令和数据组成，但这些指令要运行，数据要读写，就必须将指令加载至 CPU，数据加载至内存。在指令运行过程中还需要用到磁盘、网络等设备。进程就是用来加载指令、管理内存、管理 IO 的
* 当一个程序被运行，从磁盘加载这个程序的代码至内存，这时就开启了一个进程。
* 进程就可以视为程序的一个实例。大部分程序可以同时运行多个实例进程（例如记事本、画图、浏览器等），也有的程序只能启动一个实例进程（例如网易云音乐、360 安全卫士等）
## 1.2. 线程
* 一个进程之内可以分为一到多个线程。
* 一个线程就是一个指令流，将指令流中的一条条指令以一定的顺序交给 CPU 执行
* Java 中，线程作为最小调度单位，进程作为资源分配的最小单位。 在 windows 中进程是不活动的，只是作为线程的容器
## 1.3. 二者对比
* 进程基本上相互独立的，而线程存在于进程内，是进程的一个子集
* 进程拥有共享的资源，如内存空间等，供其内部的线程共享
* 进程间通信较为复杂
  * 同一台计算机的进程通信称为 IPC（Inter-process communication）
  * 不同计算机之间的进程通信，需要通过网络，并遵守共同的协议，例如 HTTP
* 线程通信相对简单，因为它们共享进程内的内存，一个例子是多个线程可以访问同一个共享变量
* 线程更轻量，线程上下文切换成本一般上要比进程上下文切换低
## 1.4. 并行与并发
* 单核 cpu 下，线程实际还是 串行执行 的。操作系统中有一个组件叫做任务调度器，将 cpu 的时间片（windows下时间片最小约为 15 毫秒）分给不同的程序使用，只是由于 cpu 在线程（间片很短）的切换非常快，人类感觉是 同时运行的 。
*  多核 cpu下，每个 核（core） 都可以调度运行线程，这时候线程可以是并行的。

* <font  color=33FF33>总结为一句话就是： 微观串行，宏观并行 ，一般会将这种 线程轮流使用 CPU 的做法称为并发， concurrent。</font>  
* <font  color=33FF33>并发（concurrent）是同一时间应对（dealing with）多件事情的能力</font> 
* <font  color=33FF33>并行（parallel）是同一时间动手做（doing）多件事情的能力</font> 
## 1.5. 应用
### 1.5.1. 应用之异步调用
* 需要等待结果返回，才能继续运行就是同步
* 不需要等待结果返回，就能继续运行就是异步
### 1.5.2. 应用之提高效率
<font  color=33FF33>注意 ::需要在多核 cpu 才能提高效率，单核仍然时是轮流执行</font> 
1. 单核 cpu 下，多线程不能实际提高程序运行效率，只是为了能够在不同的任务之间切换，不同线程 轮流使用cpu ，不至于一个线程总占用 cpu，别的线程没法干活
2. 多核 cpu 可以并行跑多个线程，但能否提高程序运行效率还是要分情况的
   1. 有些任务，经过精心设计，将任务拆分，并行执行，当然可以提高程序的运行效率。但不是所有计算任务都能拆分
   2. 也不是所有任务都需要拆分，任务的目的如果不同，谈拆分和效率没啥意义
3.  IO 操作不占用 cpu，只是我们一般拷贝文件使用的是【阻塞 IO】，这时相当于线程虽然不用 cpu，但需要一直等待 IO 结束，没能充分利用线程。所以才有后面的【非阻塞 IO】和【异步 IO】优化

