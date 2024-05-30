## CMake
:::info 创建简单的CMake步骤
```cmake
1. 创建cmake最低版本要求
cmake_minimum_required(VERSION 3.10)

2. 设置项目名称
project(example VERSION 1.0.0)   设置项目版本



设置c++标准
set(CMAKE_CXX_STANDARD 11)  
标准检测 
set(CMAKE_CXX_STANDARD_REQUIRED True)

3. 添加一个可执行文件(一定要指定源文件)
add_executable(example main.cpp)

target_include_directories(example PUBLIC ${PROJECT_SOURCE_DIR})   添加头文件目录

4. 编译
输出信息
message(STATUS "Building example")
```
:::

### imgui Cmake代码

:::details imgui
```cmake    
cmake_minimum_required(VERSION 3.26)
project(clon_test)

set(CMAKE_CXX_STANDARD 17)
#set(GL_Dir E:/code/stm32/clon-test) #目录名称

include_directories(
        GLFW
        imgui
        imguiNode
        src
        src/Base_graph
        src/init
        src/nodeEditor
        src/variable
        src/windows
)
file(GLOB_RECURSE SOURCES
        "GLFW/*.*"
        "imgui/*.*"
        "imguiNode/*.*"
        "src/*.*"
        "src/Base_graph/*.*"
        "src/nodeEditor/*.*"
        "src/variable/*.*"
        "src/windows/*.*"
        "src/init/*.*")
add_executable(clon_test  Main_Base.cpp ${SOURCES}  )

include_directories(${GL_Dir}/GLFW)

link_directories(${PROJECT_SOURCE_DIR})
target_link_libraries(clon_test ${PROJECT_SOURCE_DIR}/lib/glfw3.dll)

configure_file( ${PROJECT_SOURCE_DIR}/lib/glfw3.dll ${CMAKE_CURRENT_BINARY_DIR}/glfw3.dll COPYONLY)
configure_file( ${PROJECT_SOURCE_DIR}/source/arial.ttf ${CMAKE_CURRENT_BINARY_DIR}/source/arial.ttf COPYONLY)

```
:::