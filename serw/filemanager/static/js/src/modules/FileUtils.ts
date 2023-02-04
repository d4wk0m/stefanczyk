class FileUtils {
  modal: HTMLElement;
  createFolderDiv: HTMLElement = document.createElement("div");
  createFileDiv: HTMLElement = document.createElement("div");
  constructor() {
    this.modal = document.getElementById("file-modal")!;
    this.modal.onclick = (e) => {
      if (e.target === this.modal) {
        this.modal.classList.remove("show");
      }
    };
    this.createActionDivs();
  }
  createFolder(directory: string) {
    this.modal.classList.toggle("show");
    this.modal.innerHTML = "";
    this.modal.append(this.createFolderDiv);
    const hiddenInput = document.getElementById(
      "directoryValue"
    )! as HTMLInputElement;
    hiddenInput.value = directory;
  }
  createFile(directory: string) {
    this.modal.classList.toggle("show");
    this.modal.innerHTML = "";
    this.modal.append(this.createFileDiv);
    const hiddenInput = document.getElementById(
      "directoryValue"
    )! as HTMLInputElement;
    hiddenInput.value = directory;
  }

  deleteFile(directory: string, files: string[]) {
    fetch("/api/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        directory: directory,
        files: files,
      }),
    }).then(() => window.location.reload());
  }

  private createActionDivs() {
    const createFolderDiv = document.createElement("div");
    createFolderDiv.innerHTML = `<form action="/api/createFolder" method="POST">
        <input type="hidden" name="directory" id="directoryValue" value="">
        <div class="input-wrapper">
            <label for="folder-name-input">Folder name</label>
            <input type="text" id="folder-name-input" name="foldername" style="color: black">
        </div>
        <button type="submit" style="color: black">Create folder</button>
    </form>`;
    this.createFolderDiv = createFolderDiv;

    const createFileDiv = document.createElement("div");
    createFileDiv.innerHTML = `<form action="/api/createFile" method="POST">
        <input type="hidden" name="directory" id="directoryValue" value="">
        <div class="input-wrapper">
            <label for="file-name-input">File name</label>
            <input type="text" id="file-name-input" name="filename" style="color: black">
        </div>
        <button type="submit" style="color: black">Create folder</button>
    </form>`;
    this.createFileDiv = createFileDiv;
  }
}

export default new FileUtils();