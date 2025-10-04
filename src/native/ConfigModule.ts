import { NativeModules } from 'react-native';

interface ConfigModule {
  getGithubToken(): Promise<string>;
}

export default NativeModules.Config as ConfigModule;

