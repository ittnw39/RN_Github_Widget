import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { ContributionData } from '../types';
import { CONTRIBUTION_COLORS, WIDGET_CONFIGS } from '../constants';
import { WidgetSize } from '../types';

interface ContributionGridProps {
  data: ContributionData | null;
  size: WidgetSize;
  showLabels?: boolean;
  onCellPress?: (date: string, count: number) => void;
}

const ContributionGrid: React.FC<ContributionGridProps> = ({
  data,
  size,
  showLabels = true,
  onCellPress,
}) => {
  const config = WIDGET_CONFIGS[size];
  const { displayDays } = config;
  
  if (!data) {
    return <View style={styles.container} />;
  }

  const getContributionColor = (count: number): string => {
    if (count === 0) return CONTRIBUTION_COLORS[0];
    if (count < 3) return CONTRIBUTION_COLORS[1];
    if (count < 5) return CONTRIBUTION_COLORS[2];
    if (count < 10) return CONTRIBUTION_COLORS[3];
    return CONTRIBUTION_COLORS[4];
  };

  const getCellSize = (): number => {
    switch (size) {
      case '1x1': return 8;
      case '2x1': return 10;
      case '3x1': return 12;
      case '4x1': return 14;
      case '4x2': return 16;
      case '4x3': return 18;
      default: return 16;
    }
  };

  const getSpacing = (): number => {
    return getCellSize() * 0.1; // 10% spacing
  };

  const cellSize = getCellSize();
  const spacing = getSpacing();
  const totalSize = cellSize + spacing;

  // 날짜 범위 계산
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - displayDays + 1);

  // 그리드 크기 계산
  const weeks = Math.ceil(displayDays / 7);
  const width = weeks * totalSize;
  const height = 7 * totalSize;

  // 요일 라벨
  const dayLabels = ['월', '', '수', '', '금', '', ''];
  
  // 월 라벨 계산
  const monthLabels: Array<{ month: string; x: number }> = [];
  let currentMonth = -1;
  let weekIndex = 0;

  for (let i = 0; i < displayDays; i += 7) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    if (date.getMonth() !== currentMonth) {
      currentMonth = date.getMonth();
      monthLabels.push({
        month: (date.getMonth() + 1).toString(),
        x: weekIndex * totalSize,
      });
    }
    weekIndex++;
  }

  const renderCells = () => {
    const cells = [];
    
    for (let i = 0; i < displayDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = data.contributionsByDay.get(dateStr) || 0;
      const color = getContributionColor(count);
      
      const weekIndex = Math.floor(i / 7);
      const dayIndex = i % 7;
      
      const x = weekIndex * totalSize;
      const y = dayIndex * totalSize;
      
      cells.push(
        <Rect
          key={i}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          fill={color}
          rx={2}
          ry={2}
          onPress={() => onCellPress?.(dateStr, count)}
        />
      );
    }
    
    return cells;
  };

  const renderDayLabels = () => {
    if (!showLabels) return null;
    
    return dayLabels.map((label, index) => {
      if (!label) return null;
      
      return (
        <SvgText
          key={index}
          x={-20}
          y={index * totalSize + cellSize / 2 + 4}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          {label}
        </SvgText>
      );
    });
  };

  const renderMonthLabels = () => {
    if (!showLabels) return null;
    
    return monthLabels.map((label, index) => (
      <SvgText
        key={index}
        x={label.x + cellSize / 2}
        y={-5}
        fontSize="10"
        fill="#666"
        textAnchor="middle"
      >
        {label.month}월
      </SvgText>
    ));
  };

  return (
    <View style={styles.container}>
      <Svg width={width + 40} height={height + 30}>
        {renderMonthLabels()}
        {renderDayLabels()}
        {renderCells()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContributionGrid;
