import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Back from 'react-native-vector-icons/AntDesign';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Buffer } from 'buffer';
import env from './env';

const Analytic = () => {
    const navigation = useNavigation();
    const [totalVideos, setTotalVideos] = useState(0);
    const [totalRecruiters, setTotalRecruiters] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [users, setUsers] = useState([]);
    const [recruiters, setRecruiters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTotalVideos = async () => {
            try {
                const response = await axios.get(
                    `https://app.wezume.in/api/videos/video-count`,
                );
                setTotalVideos(response.data);
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching score:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchTotalUser = async () => {
            try {
                const response = await axios.get(
                    `https://app.wezume.in/users/signup-count`,
                );
                setTotalUsers(response.data);
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching score:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchTotalRecruiters = async () => {
            try {
                const response = await axios.get(
                    `https://app.wezume.in/users/recruiters-count`,
                );
                setTotalRecruiters(response.data);
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching score:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchActiveUsers = async () => {
            try {
                const res = await axios.get('https://app.wezume.in/api/weekly-active-users');
                setUsers(res.data);
            } catch (error) {
                console.error('Failed to fetch active users:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRecruiters = async () => {
            try {
                const res = await axios.get('https://app.wezume.in/users/recruiters'); // Replace <YOUR_IP>
                setRecruiters(res.data);
            } catch (error) {
                console.error('Failed to fetch recruiters:', error);
            } finally {
                setLoading(false);
            }
        };


        fetchTotalVideos();
        fetchTotalUser();
        fetchRecruiters();
        fetchTotalRecruiters();
        fetchActiveUsers();
    }, []);

    return (
        <>
            <ImageBackground
                source={require('./assets/login.jpg')}
                style={styles.bodycont}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Back name={'leftcircle'} size={24} style={styles.backoption} />
                </TouchableOpacity>
            </ImageBackground>
            <View style={styles.container}>
                {/* Header with Profile Picture */}
                <View style={styles.section}>
                    <View style={{ marginTop: '4%', marginLeft: '3%', marginRight: '3%' }}>
                        <View
                            style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                                Users
                            </Text>
                            <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{totalUsers}/1k</Text>
                        </View>
                        <View
                            style={{
                                marginTop: 6,
                                height: 10,
                                backgroundColor: '#E0E0E0',
                                borderRadius: 5,
                                overflow: 'hidden',
                            }}>
                            <View
                                style={{
                                    width: `${(totalUsers / 1000) * 100}%`,  // Corrected the template literal syntax
                                    height: '100%',
                                    backgroundColor: totalUsers < 300 ? 'red' : totalUsers <= 700 ? 'orange' : 'green',
                                }}
                            />
                        </View>
                    </View>
                    <View style={{ marginTop: '4%', marginLeft: '3%', marginRight: '3%' }}>
                        <View
                            style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                                Videos
                            </Text>
                            <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{totalVideos}/1K</Text>
                        </View>
                        <View
                            style={{
                                marginTop: 6,
                                height: 10,
                                backgroundColor: '#E0E0E0',
                                borderRadius: 5,
                                overflow: 'hidden',
                            }}>
                            <View
                                style={{
                                    width: `${(totalVideos / 1000) * 100}%`,  // Corrected the template literal syntax
                                    height: '100%',
                                    backgroundColor: totalVideos < 300 ? 'red' : totalVideos <= 700 ? 'orange' : 'green',
                                }}
                            />
                        </View>
                    </View>
                    <View style={{ marginTop: '4%', marginLeft: '3%', marginRight: '3%' }}>
                        <View
                            style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                                Recruiters
                            </Text>
                            <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{totalRecruiters}/1K</Text>
                        </View>
                        <View
                            style={{
                                marginTop: 6,
                                height: 10,
                                backgroundColor: '#E0E0E0',
                                borderRadius: 5,
                                overflow: 'hidden',
                            }}>
                            <View
                                style={{
                                    width: `${(totalRecruiters / 1000) * 100}%`,  // Corrected the template literal syntax
                                    height: '100%',
                                    backgroundColor: totalRecruiters < 300 ? 'red' : totalRecruiters <= 700 ? 'orange' : 'green',
                                }}
                            />
                        </View>
                    </View>
                </View>
                <View style={{height: '37%',paddingBottom: 20,}}>

                    {/* User Activity Log */}
                    <View style={{ marginBottom: 30 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#333' }}>
                            User Activity Log
                        </Text>

                        {/* Header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: '#E8E8E8',
                                paddingVertical: 8,
                                paddingHorizontal: 5,
                                borderTopLeftRadius: 6,
                                borderTopRightRadius: 6,
                            }}
                        >
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>User ID</Text>
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>Name</Text>
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>Job Option</Text>
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>Active Time</Text>
                        </View>

                        {/* Scrollable Rows */}
                        <ScrollView style={{ maxHeight: 300 }}>
                            {users.map((item, index) => (
                                <View
                                    key={item.userId}
                                    style={{
                                        flexDirection: 'row',
                                        backgroundColor: index % 2 === 0 ? '#F9F9F9' : '#FFFFFF',
                                        paddingVertical: 8,
                                        paddingHorizontal: 5,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#DDD',
                                    }}
                                >
                                    <Text style={{ flex: 2, color: '#000' }}>{item.userId}</Text>
                                    <Text style={{ flex: 2, color: '#000' }}>{item.name}</Text>
                                    <Text style={{ flex: 2, color: '#000' }}>{item.jobOption}</Text>
                                    <Text style={{ flex: 2, color: '#000' }}>{item.formattedTime}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Recruiter Log */}
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#333' }}>
                            Recruiter Log
                        </Text>

                        {/* Header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: '#E8E8E8',
                                paddingVertical: 8,
                                paddingHorizontal: 5,
                                borderTopLeftRadius: 6,
                                borderTopRightRadius: 6,
                            }}
                        >
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>User ID</Text>
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>Name</Text>
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>Job Option</Text>
                            <Text style={{ flex: 2, fontWeight: '600', color: '#333' }}>Company</Text>
                        </View>

                        {/* Scrollable Rows */}
                        <ScrollView style={{ maxHeight: 300 }}>
                            {recruiters.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={{
                                        flexDirection: 'row',
                                        backgroundColor: index % 2 === 0 ? '#F9F9F9' : '#FFFFFF',
                                        paddingVertical: 8,
                                        paddingHorizontal: 5,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#DDD',
                                    }}
                                >
                                    <Text style={{ flex: 2, color: '#000' }}>{item.id}</Text>
                                    <Text style={{ flex: 2, color: '#000' }}>{item.firstName}</Text>
                                    <Text style={{ flex: 2, color: '#000' }}>{item.jobOption}</Text>
                                    <Text style={{ flex: 2, color: '#000' }}>{item.currentEmployer}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View >
        </>
    );
};

const styles = StyleSheet.create({
    bodycont: {
        flex: 1.5,
        resizeMode: 'cover',
        width: '100%',
    },
    container: {
        flex: 9,
        padding: 20,
        backgroundColor: '#f7f8fc',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: '-23%',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        elevation: 5,
    },
    profileName: {
        marginTop: '-2%',
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
    },
    jobTitle: {
        fontSize: 16,
        color: 'gray',
    },
    section: {
        marginBottom: 15,
        backgroundColor: '#ffffff',
        height: '27%',
        width: '100%',
        borderRadius: 10,
        elevation: 5,
    },
    section2: {
        marginBottom: 15,
        backgroundColor: '#ffffff',
        height: '30%',
        width: '100%',
        borderRadius: 10,
        elevation: 5,
    },
    backoption: {
        color: '#ffffff',
        padding: 10,
        marginLeft: '3%',
        marginTop: '5%',
    },
    trophy: {
        padding: 10,
    },


});

export default Analytic;
