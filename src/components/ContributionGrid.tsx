import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ContributionData } from '../types';

interface ContributionGridProps {
  data: ContributionData | null;
  size?: 'full' | 'compact';
  showLabels?: boolean;
  weeks?: number;     // 표시할 주 수
  cellSize?: number;  // 셀 크기
}

const ContributionGrid: React.FC<ContributionGridProps> = ({
  data,
  size = 'full',
  showLabels = true,
  weeks = 21,         // 기본 21주
  cellSize = 12,      // 기본 12dp
}) => {
  if (!data || data.contributionsByDay.size === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  // 기여도 레벨별 색상 (기존 Kotlin 앱과 동일)
  const colorLevels = [
    '#EEEEEE', // 0
    '#9BE9A8', // 1-2
    '#40C463', // 3-5
    '#30A14E', // 6-10
    '#216E39', // 11+
  ];

  const getContributionColor = (count: number): string => {
    if (count === 0) return colorLevels[0];
    if (count < 3) return colorLevels[1];
    if (count < 6) return colorLevels[2];
    if (count < 11) return colorLevels[3];
    return colorLevels[4];
  };

  // 날짜별 데이터를 배열로 변환하고 정렬
  const sortedDates = Array.from(data.contributionsByDay.keys()).sort();
  
  if (sortedDates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>데이터가 없습니다</Text>
      </View>
    );
  }

  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);

  // 월요일 기준으로 시작 오프셋 계산
  const firstDayOfWeek = firstDate.getDay(); // 0 = 일요일, 1 = 월요일, ...
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 월요일 = 0

  // 주 단위로 그룹화
  const weeksData: Array<Array<{ date: string; count: number } | null>> = [];
  let currentWeek: Array<{ date: string; count: number } | null> = new Array(7).fill(null);
  let weekIndex = 0;
  let dayIndex = startOffset;

  // 첫 주의 시작 오프셋 설정
  for (let i = 0; i < startOffset; i++) {
    currentWeek[i] = null;
  }

  sortedDates.forEach((dateStr) => {
    const count = data.contributionsByDay.get(dateStr) || 0;
    currentWeek[dayIndex] = { date: dateStr, count };
    dayIndex++;

    if (dayIndex === 7) {
      weeksData.push([...currentWeek]);
      currentWeek = new Array(7).fill(null);
      dayIndex = 0;
      weekIndex++;
    }
  });

  // 마지막 주가 비어있지 않으면 추가
  if (dayIndex > 0) {
    weeksData.push(currentWeek);
  }

  // 최근 N주만 표시 (Kotlin 앱과 동일)
  const displayWeeks = weeksData.slice(-weeks);

  const cellSpacing = 1; // Kotlin 앱의 margin과 동일
  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  // 월 라벨 생성
  const monthLabels: Array<{ month: string; weekIndex: number }> = [];
  let lastMonth = -1;
  
  displayWeeks.forEach((week, weekIdx) => {
    const firstDayOfWeek = week.find(day => day !== null);
    if (firstDayOfWeek) {
      const date = new Date(firstDayOfWeek.date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthLabels.push({ month: monthNames[month], weekIndex: weekIdx });
        lastMonth = month;
      }
    }
  });

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.monthLabelsContainer}>
          <View style={[styles.monthLabelSpacer, { width: 30 }]} />
          {monthLabels.map((label, idx) => (
            <View
              key={idx}
              style={[
                styles.monthLabel,
                { left: 30 + label.weekIndex * (cellSize + cellSpacing) },
              ]}
            >
              <Text style={styles.monthLabelText}>{label.month}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.gridContainer}>
        {showLabels && (
          <View style={styles.dayLabelsContainer}>
            {dayLabels.map((label, idx) => (
              <View
                key={idx}
                style={[styles.dayLabelCell, { height: cellSize + cellSpacing }]}
              >
                <Text style={styles.dayLabelText}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.weeksContainer}>
            {displayWeeks.map((week, weekIdx) => (
              <View key={weekIdx} style={styles.weekColumn}>
                {week.map((day, dayIdx) => (
                  <View
                    key={`${weekIdx}-${dayIdx}`}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        marginBottom: dayIdx < 6 ? cellSpacing : 0,
                        marginRight: cellSpacing,
                        backgroundColor: day ? getContributionColor(day.count) : 'transparent',
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  monthLabelsContainer: {
    flexDirection: 'row',
    height: 20,
    marginBottom: 4,
  },
  monthLabelSpacer: {
    height: 20,
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
  },
  monthLabelText: {
    fontSize: 10,
    color: '#666',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabelsContainer: {
    width: 30,
    justifyContent: 'space-between',
  },
  dayLabelCell: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  dayLabelText: {
    fontSize: 9,
    color: '#666',
  },
  weeksContainer: {
    flexDirection: 'row',
  },
  weekColumn: {
    flexDirection: 'column',
  },
  cell: {
    borderRadius: 2,
  },
});

export default ContributionGrid;
