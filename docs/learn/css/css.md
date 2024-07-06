# css 笔记
## 1. 选择器
### 1.1. 通配选择器

::: tip 通配选择器
```css
p{
    color: red:
}
```
:::

### 1.2. 类选择器
::: tip 类选择器

```html
<div class = "choose"></div>
<style>
.choose{
    color: red:
}
</style>
```
:::

### 1.3. id选择器
::: tip id选择器

```html
<div id = "choose"></div>
<style>
#id{
    color: red:
}
</style>
```
:::


### 1.4. 交集选择器
::: tip 交集选择器

```html
<div id = "choose"></div>
<style>
div#id{
    color: red:
}
</style>
```
:::

### 1.5. 并集选择器
::: tip 并集选择器

```html
<div id = "choose"></div>
<style>
div,
#id {
    color: red:
}
</style>
```
:::

### 1.6. 后代选择器
::: tip 后代选择器

```html
<div id = "choose">
<span></span> 
</div>
<style>
div span {
    color: red:
}
</style>
```
:::

### 1.7. 子代选择器
::: tip 子代选择器

```html
<div id = "choose">
<span></span> 
</div>
<style>
div>span {
    color: red:
}
</style>
```
:::