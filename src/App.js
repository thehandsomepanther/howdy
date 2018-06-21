import React, { Component } from "react";
import * as posenet from "@tensorflow-models/posenet";
import { drawKeypoints, drawSkeleton } from "./util/demo_util";

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

const isiOS = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const isMobile = () => {
  return isAndroid() || isiOS();
};

const VIDEO_HEIGHT = 500;
const VIDEO_WIDTH = 600;

class App extends Component {
  componentDidMount() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
    this.bindPage();
  }

  detectPoseInRealTime = () => {
    const canvas = document.getElementById("output");
    const ctx = canvas.getContext("2d");
    // since images are being fed from a webcam
    const flipHorizontal = true;

    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;

    const poseDetectionFrame = () => {
      // Scale an image down to a certain factor. Too large of an image will slow
      // down the GPU
      const imageScaleFactor = 0.5;
      const outputStride = 16;

      let poses = [];
      let minPoseConfidence;
      let minPartConfidence;
      this.net
        .estimateMultiplePoses(
          this.video,
          imageScaleFactor,
          flipHorizontal,
          outputStride,
          5,
          0.1,
          30.0
        )
        .then(poses => {
          minPoseConfidence = 0.15;
          minPartConfidence = 0.1;

          ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-VIDEO_WIDTH, 0);
          ctx.drawImage(this.video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
          ctx.restore();

          // For each pose (i.e. person) detected in an image, loop through the poses
          // and draw the resulting skeleton and keypoints if over certain confidence
          // scores
          poses.forEach(({ score, keypoints }) => {
            if (score >= minPoseConfidence) {
              drawKeypoints(keypoints, minPartConfidence, ctx);
              drawSkeleton(keypoints, minPartConfidence, ctx);
            }
          });

          requestAnimationFrame(poseDetectionFrame);
        });
    };

    poseDetectionFrame();
  };

  setupCamera = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }

    const video = document.getElementById("video");
    video.width = VIDEO_WIDTH;
    video.height = VIDEO_HEIGHT;

    const mobile = isMobile();

    return new Promise(resolve => {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: mobile ? undefined : VIDEO_WIDTH,
            height: mobile ? undefined : VIDEO_HEIGHT
          }
        })
        .then(stream => {
          video.srcObject = stream;

          video.onloadedmetadata = () => {
            resolve(video);
          };
        });
    });
  };

  loadVideo = () => {
    return new Promise(resolve => {
      this.setupCamera().then(video => {
        video.play();
        resolve(video);
      });
    });
  };

  bindPage = () => {
    posenet.load(0.75).then(net => {
      document.getElementById("main").style.display = "block";

      this.net = net;

      try {
        this.loadVideo().then(video => {
          this.video = video;
          this.detectPoseInRealTime();
        });
      } catch (e) {
        let info = document.getElementById("info");
        info.textContent =
          "this browser does not support video capture," +
          "or this device does not have a camera";
        info.style.display = "block";
        throw e;
      }
    });
  };

  render() {
    return (
      <div>
        <div id="main" style={{ display: "none" }}>
          <video
            id="video"
            playsInline
            style={{
              transform: "scaleX(-1)",
              display: "none"
            }}
          />
          <canvas id="output" />
        </div>
      </div>
    );
  }
}

export default App;
