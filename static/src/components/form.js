import { InputError } from "./input-error";
import { Utils } from "./utils";

import { Socket } from "./socket";
import { Loading } from "./loading";

export async function Form() {
  const io = Socket();

  const id = await io.connect();
  const socket = io.getSocket();

  const inputError = InputError();
  const utils = Utils();

  const loading = Loading();

  const form = document.querySelector(".main-form");

  form.addEventListener("submit", onSubmit);

  socket.on("fetch-info", () => {
    loading.setText("Fetching video info...");
  });

  socket.on("start-download", () => {
    loading.setText("Starting download...");
  });

  socket.on("download-state-change", (percent) => {
    percent = Number(percent);

    if (percent >= 100) {
      return loading.resetState();
    }

    loading.setPercentage(percent);
    loading.setText(percent + "%");
  });

  socket.on("download-complete", () => {
    loading.resetState();
  });

  async function onSubmit(e) {
    e.preventDefault();

    const videoURL = document.querySelector("input[name=video-url]").value;
    const downloadAsVideo =
      document.querySelector("select").value === "Video - mp4";

    if (!videoURL) {
      return inputError.show();
    }
    inputError.hide();

    try {
      const response = await fetch("/download", {
        headers: {
          "video-url": videoURL,
          "download-as-video": downloadAsVideo.toString(),
          "socket-client-id": id,
        },
      });

      const { headers } = response;

      const blob = await response.blob();

      const title = headers.get("video-title");

      utils.downloadFile(blob, title);
    } catch (error) {
      console.log(error);
    }
  }
}
