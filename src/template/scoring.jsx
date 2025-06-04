import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Score from 'react-native-vector-icons/SimpleLineIcons';
import Back from 'react-native-vector-icons/AntDesign';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Buffer } from 'buffer';
import env from './env';

const Scoring = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const [feedback, setFeedback] = useState({ strength: '', improvement: '' });
  const [score, setScore] = useState(0);
  const [Clarity, setClarity] = useState(0);
  const [Confidence, setCofidence] = useState(0);
  const [Authenticity, setAuthenticity] = useState(0);
  const [emotional, setEmotional] = useState(0);
  const { videoId, userId } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');


  const getDynamicFeedback = ({ Clarity, Confidence, Authenticity, Emotional }) => {
    const scores = [
      { key: 'Clarity', value: Number(Clarity) },
      { key: 'Confidence', value: Number(Confidence) },
      { key: 'Authenticity', value: Number(Authenticity) },
      { key: 'Emotional', value: Number(Emotional) },
    ];

    scores.sort((a, b) => a.value - b.value);
    console.log('Sorted Scores:', scores);

    const weakest = scores[0].key;
    console.log('Weakest Attribute:', weakest);

    const feedbackMessages = {
      Clarity: {
        strength: 'Shows potential to express ideas.',
        improvement: 'Needs structured thought and clearer articulation.',
      },
      Confidence: {
        strength: 'Shows honesty and openness.',
        improvement: 'Work on tone, eye contact, and vocal steadiness.',
      },
      Authenticity: {
        strength: 'Cautious and controlled.',
        improvement: 'Loosen up for better emotional engagement.',
      },
      Emotional: {
        strength: 'Mindful and considered.',
        improvement: 'Vary pace and tone to match emotional context.',
      },
    };

    return feedbackMessages[weakest];
  };


  useEffect(() => {
    const fetchScore = async videoId => {
      try {
        const response = await axios.get(
          `https://app.wezume.in/api/totalscore/${videoId}`,
        );
        console.log(response.data);

        setClarity(response.data.clarityScore);
        setCofidence(response.data.confidenceScore);
        setAuthenticity(response.data.authenticityScore);
        setEmotional(response.data.emotionalScore);
        setScore(response.data.totalScore);
        console.log('Score:', response.data.totalScore); // Debug log
        // 💡 Update feedback after scores are set
        const dynamicFeedback = getDynamicFeedback({
          Clarity: response.data.clarityScore,
          Confidence: response.data.confidenceScore,
          Authenticity: response.data.authenticityScore,
          Emotional: response.data.emotionalScore,
        });

        setFeedback(dynamicFeedback);
        console.log('Feedback:', dynamicFeedback);
      } catch (error) {
        console.error('Error fetching score:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserDetails = async userId => {
      try {
        console.log('Fetching user details for userId:', userId); // Debug log

        const response = await axios.get(
          `${env.baseURL}/api/videos/getOwnerByUserId/${userId}`,
        );

        // console.log('User Details Response:', response);

        if (response.data) {
          const user = response.data;
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUserDetails(userId); // Fetch user details
    fetchScore(videoId);
  }, [videoId, userId]); // Fetch score when videoId changes

  useEffect(() => {
    if (userId) {
      fetchProfilePic(userId);
    } else {
      console.error('No userId found');
      setLoading(false);
    }
  }, [userId]);

  const fetchProfilePic = async userId => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${env.baseURL}/users/user/${userId}/profilepic`,
        {
          responseType: 'arraybuffer',
        },
      );

      if (response.data) {
        const base64Image = `data:image/jpeg;base64,${Buffer.from(
          response.data,
          'binary',
        ).toString('base64')}`;
        setProfileImage(base64Image);
      } else {
        console.error('Profile picture not found in response');
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error fetching profile pic:', error);
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  };

  const getHashtags = score => {
    const clarity = score?.Clarity ?? 0;
    if (clarity < 4) {
      const tags = ['#Fragmented', '#Unclear', '#Fuzzy'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (clarity >= 4 && clarity <= 6) {
      const tags = ['#Improving', '#Understandable', '#Coherent'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (clarity > 6 && clarity <= 8) {
      const tags = ['#Fluent', '#Clear', '#Articulate'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    return ['#Articulate'];
  };

  const getHashtags1 = score => {
    const confidence = score?.Confidence ?? 0;
    if (confidence < 4) {
      const tags = ['#Hesitant', '#Unsteady', '#Reserved'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (confidence >= 4 && confidence <= 6) {
      const tags = ['#Composed', '#Balanced', '#Steady'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (confidence > 6 && confidence <= 8) {
      const tags = ['#Poised'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    return ['#Assured'];
  };

  const getHashtags2 = score => {
    const authenticity = score?.Authenticity ?? 0;
    if (authenticity < 4) {
      const tags = ['#Guarded', '#Mechanical', '#Distant'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (authenticity >= 4 && authenticity <= 6) {
      const tags = ['#Honest', '#Sincere', '#Natural'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (authenticity > 6 && authenticity <= 8) {
      const tags = ['#Natural'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    return ['#Genuine'];
  };

  const getHashtags3 = score => {
    const emotional = score?.EmotionalExpressiveness ?? 0;
    if (emotional < 4) {
      const tags = ['#Disconnected', '#Flat', '#Detached'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (emotional >= 4 && emotional <= 6) {
      const tags = ['#In-Tune', '#Observant', '#Thoughtful'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    if (emotional > 6 && emotional <= 8) {
      const tags = ['#Empathic'];
      return [tags[Math.floor(Math.random() * tags.length)]];
    }
    return ['#Expressive'];
  };


  const clarity = Math.round((Clarity / 10) * 100);
  const authenticity = Math.round((Authenticity / 10) * 100);

  const emotion = Math.round((emotional / 10) * 100);

  const confidence = Math.round((Confidence / 10) * 100);


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
        <View style={styles.header}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <Text style={styles.profileName}>
            {firstName} {lastName}
          </Text>
        </View>
        <View style={styles.section}>
          <View style={{ alignItems: 'center', marginTop: '4%' }}>
            <Score name={'speedometer'} size={40} color={'#0788c4'} />
            <View style={{ flexDirection: 'row', marginTop: '4%' }}>
              <Image
                source={require('D:/work/WEB_IN_TEK/src/template/assets/circle.png')}
                style={{ width: 37, height: 37, marginRight: '2%', marginTop: '-1%' }}
              />
              <Text style={{ color: '#71797E', fontSize: 24, fontWeight: '600' }}>
                Score  {score}/10
              </Text>
            </View>
          </View>
          <View style={{ marginTop: '4%', marginLeft: '3%', marginRight: '3%' }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                Clarity
              </Text>
              <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{clarity} % </Text>
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
                  width: `${(Clarity / 10) * 100}%`,  // Corrected the template literal syntax
                  height: '100%',
                  backgroundColor: Clarity < 4 ? 'red' : Clarity <= 7 ? 'orange' : 'green',
                }}
              />
            </View>
          </View>
          <View style={{ marginTop: '6%', marginLeft: '3%', marginRight: '3%' }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                Confidence
              </Text>
              <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{confidence} % </Text>
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
                  width: `${(Confidence / 10) * 100}%`,  // Corrected the template literal syntax
                  height: '100%',
                  backgroundColor: Confidence < 4 ? 'red' : Confidence <= 7 ? 'orange' : 'green',
                }}
              />
            </View>
          </View>
          <View style={{ marginTop: '6%', marginLeft: '3%', marginRight: '3%' }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                Authenticity
              </Text>
              <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{authenticity} % </Text>
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
                  width: `${(Authenticity / 10) * 100}%`,  // Corrected the template literal syntax
                  height: '100%',
                  backgroundColor: Authenticity < 4 ? 'red' : Authenticity <= 7 ? 'orange' : 'green',
                }}
              />
            </View>
          </View>
          <View style={{ marginTop: '6%', marginLeft: '3%', marginRight: '3%' }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600' }}>
                Emotional Intelligence
              </Text>
              <Text style={{ color: '#71797E', fontSize: 15, fontWeight: '600' }}>{emotion} % </Text>
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
                  width: `${(emotional / 10) * 100}%`,  // Corrected the template literal syntax
                  height: '100%',
                  backgroundColor: emotional < 4 ? 'red' : emotional <= 7 ? 'orange' : 'green',
                }}
              />
            </View>
          </View>
        </View>
        <View style={styles.section2}>
          <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop: '2%' }}>
            <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600', marginLeft: '2%' }}>
              Strength
            </Text>
            <Text style={{ color: '#71797E', fontSize: 14, fontWeight: '400', marginLeft: '3%' }}>
              {feedback.strength}
            </Text>
          </View>
          <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop: '2%' }}>
            <Text style={{ color: '#71797E', fontSize: 16, fontWeight: '600', marginLeft: '2%' }}>
              Areas to improve
            </Text>
            <Text style={{ color: '#71797E', fontSize: 14, fontWeight: '400', marginLeft: '3%' }}>
              {feedback.improvement}
            </Text>
          </View>
        </View>
        <View style={styles.section3}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View
              style={{
                marginTop: '2%',
                marginLeft: '2%',
              }}>
              {getHashtags(7.9).map((tag, index) => (
                <Text
                  key={index}
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#0788c4',
                    padding: 5,
                    fontSize: 14,
                    fontWeight: '500',
                    marginLeft: '2%',
                    borderRadius: 10,
                    elevation: 10,
                  }}>
                  {tag}
                </Text>
              ))}
            </View>
            <View
              style={{
                marginTop: '2%',
                marginLeft: '4%',
              }}>
              {getHashtags1(7.9).map((tag, index) => (
                <Text
                  key={index}
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#0788c4',
                    padding: 5,
                    fontSize: 14,
                    fontWeight: '500',
                    marginLeft: '2%',
                    borderRadius: 10,
                    elevation: 10,
                  }}>
                  {tag}
                </Text>
              ))}
            </View>
            <View
              style={{
                marginTop: '2%',
                marginLeft: '2%',
              }}>
              {getHashtags2(7.9).map((tag, index) => (
                <Text
                  key={index}
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#0788c4',
                    padding: 5,
                    fontSize: 14,
                    fontWeight: '500',
                    borderRadius: 10,
                    marginLeft: '2%',
                    elevation: 10,
                  }}>
                  {tag}
                </Text>
              ))}
            </View>
            <View
              style={{
                marginTop: '2%',
                marginLeft: '2%',
              }}>
              {getHashtags3(7.9).map((tag, index) => (
                <Text
                  key={index}
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#0788c4',
                    padding: 5,
                    fontSize: 14,
                    fontWeight: '500',
                    borderRadius: 10,
                    marginLeft: '2%',
                    elevation: 10,
                  }}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
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
    height: '50%',
    width: '100%',
    borderRadius: 10,
    elevation: 5,
  },
  section2: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    height: '22%',
    width: '100%',
    borderRadius: 10,
    elevation: 5,
  },
  section3: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    height: '12%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
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

export default Scoring;
