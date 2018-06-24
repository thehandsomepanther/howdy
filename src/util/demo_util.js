/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licnses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from "@tensorflow-models/posenet";

const color = "aqua";
const lineWidth = 2;

function toTuple({ y, x }) {
  return [y, x];
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints,
    minConfidence
  );

  adjacentKeyPoints.forEach(keypoints => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      color,
      scale,
      ctx
    );
  });
}

const NOSE = 0;
const LEFT_EYE = 1;
const RIGHT_EYE = 2;
const LEFT_EAR = 3;
const RIGHT_EAR = 4;
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
const LEFT_ELBOW = 7;
const RIGHT_ELBOW = 8;
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;
const LEFT_HIP = 11;
const RIGHT_HIP = 12;
const LEFT_KNEE = 13;
const RIGHT_KNEE = 14;
const LEFT_ANKLE = 15;
const RIGHT_ANKLE = 16;

/**
 * Draw pose keypoints onto a canvas
 */
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

const distance = (pos1, pos2) =>
  Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);

export function drawSheriff(keypoints, minConfidence, ctx, scale) {
  const fontSize = Math.floor(
    distance(keypoints[LEFT_EYE].position, keypoints[RIGHT_EYE].position) * 3
  );
  ctx.font = `${fontSize}px serif`;

  drawSheriffHead(keypoints, minConfidence, ctx, fontSize);
  drawSheriffBoots(keypoints, minConfidence, ctx, fontSize);
  drawSheriffHands(keypoints, minConfidence, ctx, fontSize);
  drawSheriffBody(keypoints, minConfidence, ctx, fontSize);
}

function drawSheriffHead(keypoints, minConfidence, ctx, fontSize) {
  ctx.fillText(
    "🤠",
    keypoints[NOSE].position.x - fontSize / 2,
    keypoints[NOSE].position.y + fontSize / 3
  );
}

function drawSheriffBoots(keypoints, minConfidence, ctx, fontSize) {
  ctx.fillText(
    "👢",
    keypoints[LEFT_ANKLE].position.x - fontSize / 2,
    keypoints[LEFT_ANKLE].position.y + fontSize
  );
  ctx.fillText(
    "👢",
    keypoints[RIGHT_ANKLE].position.x - fontSize / 2,
    keypoints[RIGHT_ANKLE].position.y + fontSize
  );
}

function drawSheriffHands(keypoints, minConfidence, ctx, fontSize) {
  ctx.fillText(
    "👇🏽",
    keypoints[LEFT_WRIST].position.x - fontSize / 2,
    keypoints[LEFT_WRIST].position.y + fontSize
  );
  ctx.fillText(
    "👇🏽",
    keypoints[RIGHT_WRIST].position.x - fontSize / 2,
    keypoints[RIGHT_WRIST].position.y + fontSize
  );
}

function drawSheriffBody(keypoints, minConfidence, ctx, fontSize) {
  const numEmojisAcrossShoulders = 3;
  const bodyFontSize = Math.floor(
    distance(
      keypoints[LEFT_SHOULDER].position,
      keypoints[RIGHT_SHOULDER].position
    ) / numEmojisAcrossShoulders
  );

  ctx.font = `${bodyFontSize}px serif`;

  for (let i = 0; i < numEmojisAcrossShoulders; i++) {
    ctx.fillText(
      "💯",
      keypoints[RIGHT_SHOULDER].position.x + bodyFontSize * i,
      keypoints[RIGHT_SHOULDER].position.y + bodyFontSize / 2
    );
  }

  const limbs = [
    // left humerus
    [keypoints[LEFT_SHOULDER], keypoints[LEFT_ELBOW]],
    // left forearm
    [keypoints[LEFT_ELBOW], keypoints[LEFT_WRIST]],
    // right humerus
    [keypoints[RIGHT_SHOULDER], keypoints[RIGHT_ELBOW]],
    // right forearm
    [keypoints[RIGHT_ELBOW], keypoints[RIGHT_WRIST]],
    // left femur
    [keypoints[LEFT_HIP], keypoints[LEFT_KNEE]],
    // left shin
    [keypoints[LEFT_KNEE], keypoints[LEFT_ANKLE]],
    // right femur
    [keypoints[RIGHT_HIP], keypoints[RIGHT_KNEE]],
    // right shin
    [keypoints[RIGHT_KNEE], keypoints[RIGHT_ANKLE]],
    // hip
    [keypoints[LEFT_HIP], keypoints[RIGHT_HIP]],
    // torso
    [
      {
        position: {
          x:
            (keypoints[LEFT_SHOULDER].position.x +
              keypoints[RIGHT_SHOULDER].position.x) /
            2,
          y:
            (keypoints[LEFT_SHOULDER].position.y +
              keypoints[RIGHT_SHOULDER].position.y) /
            2
        }
      },
      {
        position: {
          x:
            (keypoints[LEFT_HIP].position.x +
              keypoints[RIGHT_HIP].position.x) /
            2,
          y:
            (keypoints[LEFT_HIP].position.y +
              keypoints[RIGHT_HIP].position.y) /
            2
        }
      }
    ]
  ];

  limbs.forEach(([fromJoint, toJoint]) => {
    const limbDist = distance(fromJoint.position, toJoint.position);
    const numEmojis = limbDist / bodyFontSize;
    const deltaY = (toJoint.position.y - fromJoint.position.y) / numEmojis;
    const deltaX = (toJoint.position.x - fromJoint.position.x) / numEmojis;

    for (let i = 0; i < numEmojis; i++) {
      ctx.fillText(
        "💯",
        fromJoint.position.x + deltaX * i,
        fromJoint.position.y + deltaY * i
      );
    }
  });
}
