## 定时器
### 原理
使用精准的时基，通过硬件的方式，实现定时功能
定时器核心就是计数器




```cmake
#THIS FILE IS AUTO GENERATED FROM THE TEMPLATE! DO NOT CHANGE!  

#目标系统的名称为“Generic”（通用），这意味着您正在为一个通用的目标系统编译代码，而不是针对特定的操作系统或架构
set(CMAKE_SYSTEM_NAME Generic)  

#指定了目标系统的版本号为1。与前面提到的CMAKE_SYSTEM_NAME类似，CMAKE_SYSTEM_VERSION用于指定目标系统的版本
set(CMAKE_SYSTEM_VERSION 1)

#指定了项目所需的最低CMake版本为3.26。这意味着您的项目需要使用3.26或更高版本的CMake来构建
cmake_minimum_required(VERSION 3.26)

# specify cross-compilers and tools

#指定了C语言编译器为arm-none-eabi-gcc。在嵌入式开发中，特别是针对ARM架构的目标，通常会使用交叉编译工具链来编译代码。
set(CMAKE_C_COMPILER arm-none-eabi-gcc)

set(CMAKE_CXX_COMPILER arm-none-eabi-g++)
set(CMAKE_ASM_COMPILER  arm-none-eabi-gcc)
set(CMAKE_AR arm-none-eabi-ar)
set(CMAKE_OBJCOPY arm-none-eabi-objcopy)
set(CMAKE_OBJDUMP arm-none-eabi-objdump)
set(SIZE arm-none-eabi-size)

#这个变量用于指定在尝试编译试验性的代码时所使用的目标类型。STATIC_LIBRARY表示尝试编译试验性代码时将生成静态库
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)
set(COMMON_FLAGS "-specs=nosys.specs -specs=nano.specs -u _printf_float ")

# project settings
project(montor C CXX ASM)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_C_STANDARD 11)

#Uncomment for hardware floating point
#add_compile_definitions(ARM_MATH_CM4;ARM_MATH_MATRIX_CHECK;ARM_MATH_ROUNDING)
#add_compile_options(-mfloat-abi=hard -mfpu=fpv4-sp-d16)
#add_link_options(-mfloat-abi=hard -mfpu=fpv4-sp-d16)

#Uncomment for software floating point
#add_compile_options(-mfloat-abi=soft)

add_compile_options(-mcpu=cortex-m3 -mthumb -mthumb-interwork)
add_compile_options(-ffunction-sections -fdata-sections -fno-common -fmessage-length=0)

# uncomment to mitigate c++17 absolute addresses warnings
#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-register")

# Enable assembler files preprocessing
add_compile_options($<$<COMPILE_LANGUAGE:ASM>:-x$<SEMICOLON>assembler-with-cpp>)

if ("${CMAKE_BUILD_TYPE}" STREQUAL "Release")
    message(STATUS "Maximum optimization for speed")
    add_compile_options(-Ofast)
elseif ("${CMAKE_BUILD_TYPE}" STREQUAL "RelWithDebInfo")
    message(STATUS "Maximum optimization for speed, debug info included")
    add_compile_options(-Ofast -g)
elseif ("${CMAKE_BUILD_TYPE}" STREQUAL "MinSizeRel")
    message(STATUS "Maximum optimization for size")
    add_compile_options(-Os)
else ()
    message(STATUS "Minimal optimization, debug info included")
    add_compile_options(-Og -g)
endif ()

include_directories(Core/Inc
        Drivers/STM32F1xx_HAL_Driver/Inc
        Drivers/STM32F1xx_HAL_Driver/Inc/Legacy
        Drivers/CMSIS/Device/ST/STM32F1xx/Include
        Drivers/CMSIS/Include
        Middlewares/USMART
        UserApp
)

add_definitions(-DDEBUG -DUSE_HAL_DRIVER -DSTM32F103xE)

file(GLOB_RECURSE SOURCES "Core/*.*" "Drivers/*.*" "Middlewares/*.*" "UserApp/*.*")

set(LINKER_SCRIPT ${CMAKE_SOURCE_DIR}/STM32F103ZETX_FLASH.ld)

add_link_options(-Wl,-gc-sections,--print-memory-usage,-Map=${PROJECT_BINARY_DIR}/${PROJECT_NAME}.map)
add_link_options(-mcpu=cortex-m3 -mthumb -mthumb-interwork)
add_link_options(-T ${LINKER_SCRIPT})

add_executable(${PROJECT_NAME}.elf ${SOURCES} ${LINKER_SCRIPT})

set(HEX_FILE ${PROJECT_BINARY_DIR}/${PROJECT_NAME}.hex)
set(BIN_FILE ${PROJECT_BINARY_DIR}/${PROJECT_NAME}.bin)

add_custom_command(TARGET ${PROJECT_NAME}.elf POST_BUILD
        COMMAND ${CMAKE_OBJCOPY} -Oihex $<TARGET_FILE:${PROJECT_NAME}.elf> ${HEX_FILE}
        COMMAND ${CMAKE_OBJCOPY} -Obinary $<TARGET_FILE:${PROJECT_NAME}.elf> ${BIN_FILE}
        COMMENT "Building ${HEX_FILE}
Building ${BIN_FILE}")

```