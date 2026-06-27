### 1. 玩家出生点的几种方式
#### 1.1. 第一种 <imgUtils urls="ueWord/Snipaste_2024-06-01_14-30-51.png"></imgUtils>
#### 1.2. 第二种
  * 第一步 拖拽角色蓝图到场景中<imgUtils urls="ueWord/Snipaste_2024-06-01_14-41-26.png"></imgUtils>
  * 第二步 编辑场景中角色属性，搜索auto ,编辑自动控制玩家：玩家0 <imgUtils urls="ueWord/Snipaste_2024-06-01_14-51-10.png"></imgUtils>
### 2. 打开物理引擎
   选中场景中的物体 <imgUtils urls="ueWord/Snipaste_2024-06-01_15-04-22.png"></imgUtils>

### 3. 创建网格体 Actor
   <imgUtils urls="ueWord/Snipaste_2024-06-01_15-10-56.png"></imgUtils>
   <imgUtils urls="ueWord/Snipaste_2024-06-01_15-12-47.png"></imgUtils>
双击Actor <imgUtils urls="ueWord/Snipaste_2024-06-01_15-15-17.png"></imgUtils>

添加触发器 <imgUtils urls="ueWord/Snipaste_2024-06-01_15-22-37.png"></imgUtils>

创建第一个蓝图 <imgUtils urls="ueWord/Snipaste_2024-06-01_15-30-30.png"></imgUtils> <imgUtils urls="ueWord/Snipaste_2024-06-01_15-36-02.png"></imgUtils>
创建value节点变量 需要右键点击设置文本的value针脚 点击提升到变量 <imgUtils urls="ueWord/Snipaste_2024-06-01_15-37-36.png"></imgUtils>
### 4. 创建火焰蓝图
   创建网格体 Actor
   <imgUtils urls="ueWord/Snipaste_2024-06-01_15-45-14.png"></imgUtils> <imgUtils urls="ueWord/Snipaste_2024-06-01_15-47-50.png"></imgUtils>
   <imgUtils urls="ueWord/Snipaste_2024-06-01_15-50-24.png"></imgUtils> <imgUtils urls="ueWord/Snipaste_2024-06-01_15-52-30.png"></imgUtils>

### 5. 修改游戏模式
* 复制 BP_ThirdPersonGameMode到M_BP_ThirdPersonGameMode <imgUtils urls="ueWord/Snipaste_2024-06-01_22-30-07.png"></imgUtils>
   
