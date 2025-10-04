import { NativeModules, Platform } from 'react-native';

interface WidgetModuleInterface {
  updateWidget: (size: string, data: any) => Promise<void>;
  refreshWidget: (size: string) => Promise<void>;
  clearWidget: (size: string) => Promise<void>;
  updateAllWidgets: (data: any) => Promise<void>;
}

const { WidgetModule } = NativeModules;

const WidgetModuleInterface: WidgetModuleInterface = {
  updateWidget: async (size: string, data: any) => {
    if (Platform.OS === 'android' && WidgetModule) {
      return WidgetModule.updateWidget(size, data);
    }
    console.log(`Update widget ${size} with data:`, data);
  },
  
  refreshWidget: async (size: string) => {
    if (Platform.OS === 'android' && WidgetModule) {
      return WidgetModule.refreshWidget(size);
    }
    console.log(`Refresh widget ${size}`);
  },
  
  clearWidget: async (size: string) => {
    if (Platform.OS === 'android' && WidgetModule) {
      return WidgetModule.clearWidget(size);
    }
    console.log(`Clear widget ${size}`);
  },
  
  updateAllWidgets: async (data: any) => {
    if (Platform.OS === 'android' && WidgetModule) {
      return WidgetModule.updateAllWidgets(data);
    }
    console.log('Update all widgets with data:', data);
  },
};

export default WidgetModuleInterface;
