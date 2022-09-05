import { Workspace, ServerScriptService } from "@rbxts/services";
import { KnitServer as Knit, Component } from "@rbxts/knit";

Knit.AddServices(ServerScriptService.TS.Services);
Knit.Start();
Component.Auto(ServerScriptService.TS.Components);

Workspace.FindFirstChild("Baseplate")!.Destroy()