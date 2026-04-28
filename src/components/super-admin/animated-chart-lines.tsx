import React, { useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface AnimatedChartLinesProps {
  userPoints: { x: number; y: number }[];
  storePoints: { x: number; y: number }[];
  userSeries: number[];
  storeSeries: number[];
  chartBaseline: number;
}

function getSmoothPathWorklet(points: { x: number; y: number }[]) {
  "worklet";
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    d += ` C ${cp1x},${p0.y} ${cp1x},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
}

function interpolatePoints(
  from: { x: number; y: number }[],
  to: { x: number; y: number }[],
  p: number,
) {
  "worklet";
  return from.map((fp, i) => ({
    x: fp.x + ((to[i]?.x ?? fp.x) - fp.x) * p,
    y: fp.y + ((to[i]?.y ?? fp.y) - fp.y) * p,
  }));
}

export function AnimatedChartLines({
  userPoints,
  storePoints,
  userSeries,
  storeSeries,
  chartBaseline,
}: AnimatedChartLinesProps) {
  const animProgress = useSharedValue(1);
  const baselineSV = useSharedValue(chartBaseline);

  const fromUserSV = useSharedValue(userPoints);
  const toUserSV = useSharedValue(userPoints);
  const fromStoreSV = useSharedValue(storePoints);
  const toStoreSV = useSharedValue(storePoints);

  const prevUserPointsRef = useRef(userPoints);
  const prevStorePointsRef = useRef(storePoints);
  const isFirstRender = useRef(true);

  useEffect(() => {
    baselineSV.value = chartBaseline;
  }, [chartBaseline]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fromUserSV.value = userPoints;
      toUserSV.value = userPoints;
      fromStoreSV.value = storePoints;
      toStoreSV.value = storePoints;
      prevUserPointsRef.current = userPoints;
      prevStorePointsRef.current = storePoints;
      return;
    }

    cancelAnimation(animProgress);

    fromUserSV.value = prevUserPointsRef.current;
    toUserSV.value = userPoints;
    fromStoreSV.value = prevStorePointsRef.current;
    toStoreSV.value = storePoints;

    prevUserPointsRef.current = userPoints;
    prevStorePointsRef.current = storePoints;

    animProgress.value = 0;
    animProgress.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [userSeries, storeSeries]);

  const animUserPath = useDerivedValue(() => {
    "worklet";
    const pts = interpolatePoints(fromUserSV.value, toUserSV.value, animProgress.value);
    return getSmoothPathWorklet(pts);
  });

  const animUserAreaPath = useDerivedValue(() => {
    "worklet";
    const pts = interpolatePoints(fromUserSV.value, toUserSV.value, animProgress.value);
    const smooth = getSmoothPathWorklet(pts);
    if (!smooth) return "";
    const last = pts[pts.length - 1];
    return `${smooth} L ${last.x},${baselineSV.value} L ${pts[0].x},${baselineSV.value} Z`;
  });

  const animStorePath = useDerivedValue(() => {
    "worklet";
    const pts = interpolatePoints(fromStoreSV.value, toStoreSV.value, animProgress.value);
    return getSmoothPathWorklet(pts);
  });

  const animStoreAreaPath = useDerivedValue(() => {
    "worklet";
    const pts = interpolatePoints(fromStoreSV.value, toStoreSV.value, animProgress.value);
    const smooth = getSmoothPathWorklet(pts);
    if (!smooth) return "";
    const last = pts[pts.length - 1];
    return `${smooth} L ${last.x},${baselineSV.value} L ${pts[0].x},${baselineSV.value} Z`;
  });

  const userPathProps = useAnimatedProps(() => ({ d: animUserPath.value }));
  const userAreaProps = useAnimatedProps(() => ({ d: animUserAreaPath.value }));
  const storePathProps = useAnimatedProps(() => ({ d: animStorePath.value }));
  const storeAreaProps = useAnimatedProps(() => ({ d: animStoreAreaPath.value }));

  return (
    <>
      <AnimatedPath animatedProps={storeAreaProps} fill="url(#storeAreaGrad)" />
      <AnimatedPath animatedProps={userAreaProps} fill="url(#userAreaGrad)" />
      <AnimatedPath
        animatedProps={storePathProps}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <AnimatedPath
        animatedProps={userPathProps}
        fill="none"
        stroke="#FF6600"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
