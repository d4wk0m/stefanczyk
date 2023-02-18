import { io } from "socket.io-client";

interface StatusData {
  status: string;
}

export default class Network {
  serverUrl: string = "/api/socket";
  menu: HTMLElement;
  callback: (color: "black" | "white") => void;

  constructor(
    menu: HTMLElement,
    addPlayer: (color: "black" | "white") => void
  ) {
    this.menu = menu;
    this.callback = addPlayer;
    this.handleLogin();
  }

  public async getNetwork() {
    const res = await fetch(this.serverUrl + "status", {
      method: "POST",
    });
    const data: StatusData = await res.json();
    return data.status;
  }

  handleLogin() {
    const input = this.menu.querySelector("input") as HTMLInputElement;
    const button = this.menu.querySelector("button")!;
    button.onclick = () => {
      if (input.value == "") return;
      this.addPlayer();
    };
  }

  async addPlayer() {
    const socket = io("/", {
      path: "/api/socket",

    });
    socket.on("connect", () => {
      console.log("Connected");
    });
    socket.on("message", (data) => {
      console.log(data);
    });
  }
}
