import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import QuoteFlow from './screens/QuoteFlow';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import MessagesScreen from './screens/MessagesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProviderJobsScreen from './screens/ProviderJobsScreen';
import ProviderBidsScreen from './screens/ProviderBidsScreen';
import ProviderHomeScreen from './screens/ProviderHomeScreen';
import ProviderEarningsScreen from './screens/ProviderEarningsScreen';
import MoreScreen from './screens/MoreScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import AppointmentFormScreen from './screens/AppointmentFormScreen';
import AdminUnsupportedScreen from './screens/AdminUnsupportedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icon = (emoji) => ({ color }) => <Text style={{ fontSize: 18, opacity: 1, color }}>{emoji}</Text>;
const tabOpts = { tabBarActiveTintColor: '#0ea5a4', tabBarInactiveTintColor: '#94a3b8', headerTitleStyle: { fontWeight: '800' } };

function HomeownerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Quote" component={QuoteFlow} options={{ title: 'New Quote', tabBarIcon: icon('✨') }} />
      <Tab.Screen name="Projects" component={ProjectsScreen} options={{ tabBarIcon: icon('📋') }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarIcon: icon('💬') }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarIcon: icon('•••') }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="ProviderHome" component={ProviderHomeScreen} options={{ title: 'Home', tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Jobs" component={ProviderJobsScreen} options={{ tabBarIcon: icon('🧰') }} />
      <Tab.Screen name="Quotes" component={ProviderBidsScreen} options={{ tabBarIcon: icon('📨') }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarIcon: icon('💬') }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarIcon: icon('•••') }} />
    </Tab.Navigator>
  );
}

function AppStack({ role }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" options={{ headerShown: false }}>
        {() => (role === 'provider' ? <ProviderTabs /> : <HomeownerTabs />)}
      </Stack.Screen>
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params?.title || 'Chat' })} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Schedule' }} />
      <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} options={{ title: 'Request Appointment' }} />
      <Stack.Screen name="ProviderEarnings" component={ProviderEarningsScreen} options={{ title: 'Awarded Value' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0ea5a4" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      {user?.role === 'admin' ? <AdminUnsupportedScreen /> : user ? <AppStack role={user.role} /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
