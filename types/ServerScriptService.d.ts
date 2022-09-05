interface ServerScriptService extends Instance {
	TS: Folder & {
		main: Script;
		Components: Folder;
		Services: Folder;
	};
}
