:::details imgui 使用cmd命令
```c++
	FILE* pipe = _popen("dir", "r");
	if (!pipe) {
		std::cerr << "file error"<<std::endl;
	}

	char buffer[128];
	while (!feof(pipe)) {
		if (fgets(buffer, 128, pipe)) {
			NodeEditor::outStreamCmd += buffer;
		}
	}
	_pclose(pipe);
```
:::