import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

const BlogsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 1, name: 'Mental Health', icon: 'psychology' },
    { id: 2, name: 'Nutrition', icon: 'restaurant' },
    { id: 3, name: 'Fitness', icon: 'fitness-center' },
    { id: 4, name: 'Women\'s Health', icon: 'female' },
    { id: 5, name: 'Children\'s Health', icon: 'child-care' },
    { id: 6, name: 'Senior Care', icon: 'elderly' },
  ];

  const featuredArticles = [
    {
      id: 1,
      title: 'Understanding Anxiety and Depression',
      category: 'Mental Health',
      readTime: '5 min read',
      image: require('../../../assets/blog.png'),
      description: 'Learn about the common signs, symptoms, and treatment options for anxiety and depression.',
    },
    {
      id: 2,
      title: 'Balanced Diet for Better Health',
      category: 'Nutrition',
      readTime: '4 min read',
      image: require('../../../assets/blog.png'),
      description: 'Discover the essential components of a balanced diet and how it impacts your overall health.',
    },
    {
      id: 3,
      title: 'Stay Active at Home',
      category: 'Fitness',
      readTime: '6 min read',
      image: require('../../../assets/blog.png'),
      description: 'Simple exercises and routines you can do at home to maintain your fitness levels.',
    },
  ];

  const renderCategory = ({ id, name, icon }) => (
    <TouchableOpacity key={id} style={styles.categoryItem}>
      <View style={styles.categoryIcon}>
        <MaterialIcons name={icon} size={24} color={theme.colors.card.blogs} />
      </View>
      <Text style={styles.categoryText}>{name}</Text>
    </TouchableOpacity>
  );

  const renderArticle = (article) => (
    <TouchableOpacity key={article.id} style={styles.articleCard}>
      <Image source={article.image} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <View style={styles.articleMeta}>
          <Text style={styles.articleCategory}>{article.category}</Text>
          <Text style={styles.articleReadTime}>{article.readTime}</Text>
        </View>
        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articleDescription} numberOfLines={2}>
          {article.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={theme.colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search health topics..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map(renderCategory)}
        </ScrollView>
      </View>

      {/* Featured Articles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Articles</Text>
        {featuredArticles.map(renderArticle)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 12,
    borderRadius: theme.roundness,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
  articleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 16,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  articleCategory: {
    color: theme.colors.card.blogs,
    fontSize: 12,
    fontWeight: '500',
  },
  articleReadTime: {
    color: theme.colors.secondary,
    fontSize: 12,
  },
  articleTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleDescription: {
    color: theme.colors.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default BlogsScreen;
