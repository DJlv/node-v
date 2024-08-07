# ioc
## 1. 什么是ioc
::: tip ①
Spring IOC（控制反转）是Spring框架的一个核心概念，它是一种设计模式，也被称为依赖注入（Dependency Injection，DI）。  
在传统的程序设计中，对象的创建和依赖关系的管理由程序代码直接控制，而在使用IOC容器后，这些控制权被反转，由容器来帮助创建对象和管理它们的依赖关系。  
具体来说，IOC容器负责实例化、配置和组装应用程序中的对象。  
    它通过读取配置文件（如XML配置文件或Java注解），然后根据配置文件中的信息来创建对象及其依赖关系。  
    这样一来，对象之间的依赖关系由容器来管理，而不是由对象自己来管理，这就实现了控制反转。  

控制反转的好处包括降低了组件之间的耦合度，使得代码更易于理解和维护，同时也提高了代码的可测试性和可重用性。Spring框架通过IOC容器实现了这种设计模式，使得开发者可以更专注于业务逻辑的实现，而不用过多关注对象如何被创建和管理的细节。
:::


::: tip ②
Spring 框架的核心是 Spring 容器。容器创建对象，将它们装配在一起，配置它们并管理它们的完整生命周期。Spring 容器使用依赖注入来管理组成应用程序的组件。容器通过读取提供的配置元数据来接收对象进行实例化，配置和组装的指令。该元数据可以通过 XML，Java 注解或 Java 代码提供。
:::

## 2. 什么是依赖注入
::: tip 
依赖注入（Dependency Injection，DI）是面向对象编程中的一种设计模式，也是Spring框架中IOC容器的一部分。它主要用于解决对象之间的依赖关系管理问题。

在传统的面向对象编程中，一个对象通常会直接创建它所依赖的对象，这样会导致对象之间高耦合度，使得代码难以扩展和维护。依赖注入的核心思想是，由外部容器负责创建和管理对象之间的依赖关系，然后将依赖关系注入到对象中，而不是对象自己去创建它所依赖的对象。

依赖注入可以通过构造函数注入、Setter方法注入或接口注入等方式实现。在Spring框架中，通常使用构造函数注入和Setter方法注入。例如，一个Service对象可能依赖于一个Repository对象，可以通过构造函数注入或Setter方法注入的方式，将Repository对象注入到Service对象中，而不是在Service对象内部直接创建Repository对象。

依赖注入的优点包括降低了组件之间的耦合度，使得代码更灵活、可测试和可维护。通过IOC容器管理依赖关系，开发者只需要关注业务逻辑的实现，而不用过多考虑对象的创建和依赖关系管理，提高了代码的可读性和可维护性。

:::