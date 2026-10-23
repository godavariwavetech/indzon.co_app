import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Image,
  BackHandler,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Text, TextInput} from '../../components/ReadableText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {moreArtwork} from '../../config/catalog';
import {colors, Page} from '../../components/main/MainUi';
import {
  getLiveCategories,
  liveCatalogEnabled,
  searchAll,
} from '../../services/catalogService';

const RECENT_KEY = 'amaraa.search.recent.v1';
export default function SearchScreen({navigation}) {
  const {width} = useWindowDimensions();
  const scale = Math.min(width / 393, 1.4);
  const styles = useMemo(() => makeStyles(scale), [scale]);
  const input = useRef(null);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const locationId = useSelector(state => state.Auth.locationId);
  const [liveCategories, setLiveCategories] = useState(null);
  const [liveResults, setLiveResults] = useState([]);
  useEffect(() => {
    if (!liveCatalogEnabled) {
      return;
    }
    getLiveCategories()
      .then(rows => rows.length && setLiveCategories(rows))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!liveCatalogEnabled || !locationId) {
      return;
    }
    const term = query.trim();
    if (!term) {
      setLiveResults([]);
      return;
    }
    let active = true;
    const timeout = setTimeout(() => {
      searchAll(term, locationId)
        .then(rows => active && setLiveResults(rows))
        .catch(() => active && setLiveResults([]));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, locationId]);
  const liveSearchCategories = [
    ...(liveCategories || []).slice(0, 9),
    {id: 'more', name: 'More', art: moreArtwork},
  ];
  useEffect(() => {
    if (!selectedCategory) return undefined;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedCategory(null);
      return true;
    });
    return () => listener.remove();
  }, [selectedCategory]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(RECENT_KEY)
      .then(saved => {
        if (!active || !saved) return;
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.every(term => typeof term === 'string')
        ) {
          setRecent(parsed.slice(0, 10));
        }
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loaded)
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent)).catch(() => {});
  }, [loaded, recent]);

  const remember = term => {
    const value = term.trim();
    if (!value) return;
    setRecent(items =>
      [
        value,
        ...items.filter(item => item.toLowerCase() !== value.toLowerCase()),
      ].slice(0, 10),
    );
  };
  const openCategory = category => {
    remember(category.name);
    navigation.navigate('CategoryDetails', {
      categoryId: category.id,
      selectionRequest: Date.now(),
    });
  };
  const submit = () => {
    const value = query.trim();
    if (!value) return;
    remember(value);
    const category = (liveCategories || []).find(
      item => item.name.toLowerCase() === value.toLowerCase(),
    );
    if (category) openCategory(category);
    else input.current?.blur();
  };

  return (
    <Page>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            selectedCategory ? setSelectedCategory(null) : navigation.goBack()
          }
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}>
          <MaterialIcons name="arrow-back" size={28 * scale} color="#111827" />
        </Pressable>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={23 * scale} color="#245EF5" />
          <TextInput
            ref={input}
            value={query}
            onChangeText={value => {
              setQuery(value);
              setSelectedCategory(null);
            }}
            onSubmitEditing={submit}
            placeholder="Search here"
            placeholderTextColor="#8B8E97"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search products and categories"
            style={styles.input}
            testID="search-screen-input"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear search">
              <MaterialIcons name="close" size={20 * scale} color="#75839A" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => setSelectedCategory(null)}
        showsVerticalScrollIndicator={false}>
        {selectedCategory ? (
          <Pressable
            style={styles.dismissPanel}
            onPress={() => setSelectedCategory(null)}
            accessibilityRole="button"
            accessibilityLabel="Close subcategories"
          />
        ) : null}
        {query.trim() && liveCatalogEnabled ? (
          <>
            {liveResults.map(result => (
              <Pressable
                key={result.key}
                style={styles.resultRow}
                onPress={() => {
                  remember(result.name);
                  if (result.kind === 'category') {
                    navigation.navigate('CategoryDetails', {
                      categoryId: result.categoryId,
                      selectionRequest: Date.now(),
                    });
                  } else if (result.kind === 'shop') {
                    navigation.navigate('ProductList', {
                      shopId: result.shopId,
                      shopItemsTableName: result.shopItemsTableName,
                      shopName: result.name,
                    });
                  } else {
                    navigation.navigate('ProductDetails', {
                      productId: result.product.id,
                      liveProduct: result.product,
                    });
                  }
                }}
                accessibilityRole="button">
                <View style={[styles.resultIcon, {backgroundColor: '#EEF3FF'}]}>
                  <ReferenceArtwork
                    art={result.art}
                    width={styles.resultImage.width}
                    height={styles.resultImage.height}
                    resizeMode="contain"
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.resultName}>{result.name}</Text>
                  <Text style={styles.action}>{result.tagline}</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={22 * scale}
                  color="#13213C"
                />
              </Pressable>
            ))}
            {!liveResults.length ? (
              <Text style={styles.empty}>
                No matches found. Try another search.
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.categoryRegion}>
              <View style={styles.categoryGrid}>
                {liveSearchCategories.map(item => (
                  <Pressable
                    key={item.id}
                    style={styles.categoryCard}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    accessibilityState={{
                      expanded: selectedCategory?.id === item.id,
                    }}
                    onPress={() => {
                      Keyboard.dismiss();
                      if (item.id === 'more') {
                        navigation.navigate('Home', {screen: 'CategoriesTab'});
                        return;
                      }
                      navigation.navigate('CategoryDetails', {
                        categoryId: item.id,
                        selectionRequest: Date.now(),
                      });
                    }}>
                    <View style={styles.categoryIcon}>
                      <Image
                        source={item.art.source}
                        style={styles.categoryImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={2}
                      style={styles.categoryName}>
                      {item.shortName || item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.recents}>
              <View style={styles.sectionHeading}>
                <Text style={styles.title}>Recent Searches</Text>
                <Pressable
                  onPress={() => setRecent([])}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all recent searches"
                  hitSlop={8}>
                  <Text style={styles.action}>Clear All</Text>
                </Pressable>
              </View>
              {recent.length ? (
                recent.map((term, index) => (
                  <View key={`${term}-${index}`} style={styles.recentRow}>
                    <Pressable
                      style={styles.recentMain}
                      onPress={() => {
                        setSelectedCategory(null);
                        setQuery(term);
                        input.current?.focus();
                      }}
                      accessibilityRole="button">
                      <View style={styles.clockCircle}>
                        <MaterialIcons
                          name="history"
                          size={23 * scale}
                          color="#1768F5"
                        />
                      </View>
                      <Text numberOfLines={1} style={styles.recentText}>
                        {term}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setRecent(items =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${term}`}
                      hitSlop={10}
                      style={styles.removeButton}>
                      <MaterialIcons
                        name="close"
                        size={20 * scale}
                        color="#8290A7"
                      />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>
                  Your recent searches will appear here.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      </View>
    </Page>
  );
}

const makeStyles = s =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 16 * s,
      paddingTop: 18 * s,
      paddingBottom: 10 * s,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12 * s,
      // transparent so the page's lilac-to-white gradient runs behind the input
      zIndex: 2,
    },
    back: {width: 24 * s, height: 50 * s, justifyContent: 'center'},
    searchBox: {
      flex: 1,
      height: 50 * s,
      paddingHorizontal: 14 * s,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10 * s,
      borderWidth: 1,
      borderColor: '#827CFF',
      borderRadius: 10 * s,
      backgroundColor: '#FFFFFF',
      elevation: 2,
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 2,
      shadowOffset: {width: 0, height: 2},
    },
    input: {
      flex: 1,
      height: '100%',
      padding: 0,
      color: '#111B34',
      fontSize: 14 * s,
    },
    body: {flex: 1},
    scroll: {flex: 1},
    content: {flexGrow: 1, paddingTop: 28 * s, paddingBottom: 28 * s},
    dismissPanel: {...StyleSheet.absoluteFillObject, zIndex: 2},
    categoryRegion: {zIndex: 3, marginHorizontal: 8 * s},
    categoryGrid: {flexDirection: 'row', flexWrap: 'wrap'},
    categoryCard: {width: '20%', height: 94 * s, alignItems: 'center'},
    categoryIcon: {
      width: 62 * s,
      height: 62 * s,
      borderRadius: 31 * s,
      backgroundColor: '#F0F0F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryImage: {width: 60 * s, height: 60 * s},
    categoryName: {
      fontSize: 10 * s,
      lineHeight: 12 * s,
      textAlign: 'center',
      color: '#202427',
      marginTop: 7 * s,
      paddingHorizontal: 1 * s,
    },
    subcategoryPanel: {
      position: 'absolute',
      left: 16 * s,
      right: 16 * s,
      padding: 12 * s,
      borderRadius: 14 * s,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8 * s,
      elevation: 7,
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 5,
      shadowOffset: {width: 0, height: 3},
      zIndex: 4,
    },
    subcategory: {
      width: '48.6%',
      minHeight: 38 * s,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      borderRadius: 8 * s,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * s,
      paddingHorizontal: 5 * s,
      paddingVertical: 4 * s,
    },
    subcategoryImage: {width: 28 * s, height: 28 * s},
    subcategoryName: {
      flex: 1,
      fontSize: 11.5 * s,
      lineHeight: 14 * s,
      color: '#101010',
    },
    recents: {marginHorizontal: 30 * s, marginTop: 24 * s},
    sectionHeading: {
      minHeight: 26 * s,
      marginBottom: 4 * s,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 14 * s,
      lineHeight: 20 * s,
      fontWeight: '700',
      color: '#0B123A',
    },
    action: {fontSize: 12 * s, fontWeight: '500', color: '#1768F5'},
    recentRow: {
      height: 46 * s,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E6EAF1',
    },
    recentMain: {
      flex: 1,
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    clockCircle: {
      width: 31 * s,
      height: 31 * s,
      borderRadius: 16 * s,
      backgroundColor: '#EDF3FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentText: {
      flex: 1,
      marginLeft: 12 * s,
      fontSize: 12 * s,
      color: '#0B123A',
    },
    removeButton: {
      width: 26 * s,
      height: 40 * s,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    productsHeading: {marginTop: 22 * s, marginBottom: 4 * s},
    resultRow: {
      minHeight: 61 * s,
      marginHorizontal: 16 * s,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E6EAF1',
    },
    resultIcon: {
      width: 43 * s,
      height: 43 * s,
      borderRadius: 22 * s,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    resultImage: {width: 38 * s, height: 38 * s},
    resultName: {
      flex: 1,
      marginLeft: 12 * s,
      fontSize: 14 * s,
      color: '#111B34',
    },
    empty: {padding: 20 * s, fontSize: 13 * s, color: colors.muted},
  });
