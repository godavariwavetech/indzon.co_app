import {Text} from '../../components/Typography';
import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Text as NativeText} from '../../components/ReadableText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {
  getLiveBanners,
  getLiveCategories,
  getLiveItems,
  getLiveSubcategories,
  liveCatalogEnabled,
} from '../../services/catalogService';
import {
  colors,
  EmptyState,
  Heading,
  Page,
  SearchField,
  usePageReady,
  ui,
} from '../../components/main/MainUi';
import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import {CategoryGridSkeleton} from '../../components/main/Skeleton';

export const matchesFilter = (product, filter) =>
  filter === 'under500'
    ? product.price < 500
    : filter === 'toprated'
    ? Number(product.rating) >= 4.5
    : true;

function SubcategoryTile({sub, width, count, onPress, shadowsReady}) {
  const imageWidth = Math.min(70, Math.round(width * 0.38));
  const imageHeight = 78;
  const footer = (
    <View style={styles.cardBottom}>
      <NativeText style={styles.count} numberOfLines={1}>
        {count}
      </NativeText>
      <View style={styles.arrow}>
        <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
      </View>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${sub.name}, ${count} ${
        count === 1 ? 'item' : 'items'
      }`}
      style={[
        styles.card,
        {width, backgroundColor: sub.color},
        shadowsReady && styles.cardShadow,
      ]}>
      <View style={styles.wideCard}>
        <View style={styles.wideCopy}>
          <NativeText style={styles.subcategoryName} numberOfLines={3}>
            {sub.name}
          </NativeText>
          {footer}
        </View>
        <ReferenceArtwork
          art={sub.art}
          width={imageWidth}
          height={imageHeight}
          resizeMode="contain"
          style={styles.tilePicture}
        />
      </View>
    </Pressable>
  );
}
export default function MainCategoriesScreen({
  navigation,
  route,
  standalone = false,
}) {
  const {width} = useWindowDimensions();
  const pageReady = usePageReady();
  const [categoryId, setCategoryId] = useState(route.params?.categoryId || null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const deferredCategoryId = useDeferredValue(categoryId);
  const sidebar = useRef(null);
  const content = useRef(null);
  const categoryPositions = useRef({});
  const locationId = useSelector(state => state.Auth.locationId);
  const [liveCategories, setLiveCategories] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [liveBanners, setLiveBanners] = useState([]);
  const [dataLoading, setDataLoading] = useState(liveCatalogEnabled);
  const categoryList = useMemo(() => liveCategories || [], [liveCategories]);
  useEffect(() => {
    if (!liveCatalogEnabled) {
      return;
    }
    getLiveCategories()
      .then(rows => {
        if (rows.length) {
          setLiveCategories(rows);
          setCategoryId(current => current || rows[0].id);
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!liveCatalogEnabled || !locationId) {
      return;
    }
    getLiveBanners({locationId})
      .then(setLiveBanners)
      .catch(() => {});
  }, [locationId]);
  useEffect(() => {
    if (categoryList.some(item => item.id === route.params?.categoryId)) {
      setCategoryId(route.params.categoryId);
      setQuery('');
      setFilter('all');
    }
  }, [route.params?.categoryId, route.params?.selectionRequest, categoryList]);
  useEffect(() => {
    sidebar.current?.scrollTo({
      y: Math.max(0, (categoryPositions.current[categoryId] || 0) - 20),
      animated: true,
    });
    content.current?.scrollTo({y: 0, animated: false});
  }, [categoryId]);
  const selected =
    categoryList.find(item => item.id === deferredCategoryId) ||
    categoryList[0] ||
    null;
  // Subcategories come from the backend; the items of the shops that stock
  // them are loaded too so each tile can show a count and search can match
  // product names.
  useEffect(() => {
    if (!liveCatalogEnabled || !selected || !locationId) {
      return;
    }
    let active = true;
    setDataLoading(true);
    getLiveSubcategories({categoryId: selected.id, locationId})
      .then(async subs => {
        const shopIds = [...new Set(subs.flatMap(sub => sub.shopIds))];
        const lists = await Promise.all(
          shopIds.map(shopId =>
            getLiveItems({
              shopItemsTableName: selected.shopItemsTableName,
              shopId,
            }).catch(() => []),
          ),
        );
        if (active) {
          setSubcategories(subs);
          setCategoryItems(lists.flat());
        }
      })
      .catch(() => {
        if (active) {
          setSubcategories([]);
          setCategoryItems([]);
        }
      })
      .finally(() => {
        if (active) {
          setDataLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selected, locationId]);
  const sidebarWidth = Math.max(80, Math.min(102, width * 0.23));
  // Measure inside the divider and padding: calculating from window width
  // made two cards exceed the row by one pixel and wrap into a single column.
  const availableWidth = gridWidth || width - sidebarWidth - 25;
  const cardWidth = Math.floor((availableWidth - 10) / 2);
  const bannerWidth = Math.max(0, (viewportWidth || width - sidebarWidth) - 25);
  const bannerHeight = bannerWidth / 3;
  const loading =
    !gridWidth || dataLoading || deferredCategoryId !== categoryId;
  const categoryBanner = liveBanners.find(
    banner => banner.categoryId === selected?.id,
  );
  const categoryProducts = useMemo(
    () =>
      categoryItems.filter(product => matchesFilter(product, filter)),
    [categoryItems, filter],
  );
  const subcategoryCounts = useMemo(
    () =>
      categoryProducts.reduce((counts, product) => {
        counts[product.subcategoryId] =
          (counts[product.subcategoryId] || 0) + 1;
        return counts;
      }, {}),
    [categoryProducts],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      subcategories.filter(sub => {
        const matchesQuery =
          sub.name.toLowerCase().includes(normalizedQuery) ||
          categoryProducts.some(
            product =>
              product.subcategoryId === sub.id &&
              product.name.toLowerCase().includes(normalizedQuery),
          );
        return (
          matchesQuery && (filter === 'all' || subcategoryCounts[sub.id] > 0)
        );
      }),
    [
      categoryProducts,
      filter,
      normalizedQuery,
      subcategories,
      subcategoryCounts,
    ],
  );
  return (
    <Page>
      <Heading
        title={standalone ? selected?.name || 'Categories' : 'Categories'}
        navigation={navigation}
        back={standalone}
      />
      <View style={styles.searchRow}>
        <SearchField value={query} onChangeText={setQuery} style={{flex: 1}} />
        <Pressable
          style={[
            styles.filterButton,
            filter !== 'all' && styles.selectedFilter,
          ]}
          onPress={() => setFilterVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter categories">
          <MaterialIcons
            name="tune"
            size={22}
            color={filter !== 'all' ? colors.primary : '#48535D'}
          />
          <Text style={styles.filterText}>Filter</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        {
          <ScrollView
            ref={sidebar}
            style={{width: sidebarWidth, flexGrow: 0}}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebar}>
            {categoryList.map(item => (
              <Pressable
                key={item.id}
                onLayout={event => {
                  categoryPositions.current[item.id] =
                    event.nativeEvent.layout.y;
                  if (item.id === categoryId) {
                    sidebar.current?.scrollTo({
                      y: Math.max(0, event.nativeEvent.layout.y - 20),
                      animated: false,
                    });
                  }
                }}
                onPress={() => {
                  setCategoryId(item.id);
                  setQuery('');
                  setFilter('all');
                }}
                accessibilityRole="button"
                accessibilityState={{selected: item.id === categoryId}}
                style={styles.category}>
                <LinearGradient
                  colors={
                    item.id === categoryId
                      ? ['#DED9FF', '#C8C4FF']
                      : ['#FAFAFA', '#E1E1E1']
                  }
                  start={{x: 0.5, y: 0}}
                  end={{x: 0.5, y: 1}}
                  style={[
                    styles.art,
                    {width: sidebarWidth - 26, height: sidebarWidth - 26},
                    item.id === categoryId && styles.selectedArt,
                  ]}>
                  <ReferenceArtwork
                    art={{source: item.art.source}}
                    width={sidebarWidth - 40}
                    height={sidebarWidth - 40}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.categoryName,
                    item.id === categoryId && styles.selectedName,
                  ]}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        }
        <ScrollView
          ref={content}
          onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentPadding}>
          {standalone && selected ? (
            categoryBanner ? (
              <Image
                source={{uri: categoryBanner.uri}}
                resizeMode="cover"
                accessibilityLabel={categoryBanner.title || selected.name}
                style={[
                  styles.groceryBanner,
                  {width: bannerWidth, height: bannerHeight},
                ]}
              />
            ) : null
          ) : null}
          <View
            style={styles.grid}
            onLayout={event =>
              setGridWidth(Math.floor(event.nativeEvent.layout.width))
            }
            accessibilityState={{busy: loading}}>
            {loading ? (
              <CategoryGridSkeleton
                cardWidth={cardWidth}
                compact={cardWidth < 160}
              />
            ) : (
              visible.map(sub => (
                <SubcategoryTile
                  key={sub.id}
                  sub={sub}
                  width={cardWidth}
                  count={subcategoryCounts[sub.id] || 0}
                  shadowsReady={pageReady && !loading}
                  onPress={() => {
                    const stocked = categoryItems.find(
                      product => product.subcategoryId === sub.id,
                    );
                    navigation.navigate('ProductList', {
                      categoryId,
                      subcategoryId: sub.id,
                      filter,
                      shopId: stocked?.shopId || sub.shopIds[0],
                      shopItemsTableName: selected.shopItemsTableName,
                    });
                  }}
                />
              ))
            )}
          </View>
          {!loading && !visible.length ? (
            <EmptyState
              message={
                query || filter !== 'all'
                  ? 'No matching categories. Try another search or filter.'
                  : 'No subcategories available here yet.'
              }
            />
          ) : null}
        </ScrollView>
      </View>
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
          />
          <View style={styles.filterSheet}>
            <Text style={ui.sectionTitle}>Filter products</Text>
            {[
              ['all', 'All products'],
              ['under500', 'Under ₹500'],
              ['toprated', 'Rating 4.5 and above'],
            ].map(([id, label]) => (
              <Pressable
                key={id}
                style={styles.option}
                onPress={() => {
                  setFilter(id);
                  setFilterVisible(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{selected: filter === id}}>
                <Text style={styles.optionText}>{label}</Text>
                <MaterialIcons
                  name={
                    filter === id
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                  }
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </Page>
  );
}
export function CategoryDetailsScreen(props) {
  return <MainCategoriesScreen {...props} standalone />;
}
const styles = StyleSheet.create({
  groceryBanner: {
    borderRadius: 16,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  categoryBanner: {
    borderRadius: 18,
    marginBottom: 18,
    height: 176,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F0FA',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E5F3',
  },
  bannerCopy: {
    width: '56%',
    padding: 16,
    paddingRight: 4,
    justifyContent: 'center',
  },
  bannerEyebrow: {
    color: '#655A84',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 9,
  },
  bannerTitle: {
    color: '#242038',
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
  },
  bannerCaption: {color: '#625D73', fontSize: 14, lineHeight: 19, marginTop: 8},
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 13,
  },
  bannerBadgeText: {color: colors.primary, fontSize: 11, fontWeight: '700'},
  bannerArtPanel: {
    position: 'absolute',
    right: 8,
    top: 14,
    bottom: 14,
    width: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerArtCircle: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 100,
    backgroundColor: '#E1DCF6',
  },
  bannerProduct: {width: '100%', height: '100%'},
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#C5CBD9',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
  },
  selectedFilter: {backgroundColor: '#EFEDFF', borderColor: colors.primary},
  filterText: {fontSize: 14, fontWeight: '600', color: '#48535D'},
  body: {flex: 1, flexDirection: 'row'},
  sidebar: {paddingBottom: 16, gap: 12},
  category: {alignItems: 'center', paddingHorizontal: 7},
  art: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedArt: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#C8C4FF',
  },
  categoryName: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '600',
    color: '#363636',
    marginTop: 5,
  },
  selectedName: {color: colors.ink, fontWeight: '700'},
  content: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  contentPadding: {paddingHorizontal: 12, paddingBottom: 18},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'stretch',
  },
  card: {
    borderRadius: 14,
    minHeight: 82,
    padding: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4DFDC',
  },
  cardShadow: {elevation: 1},
  wideCard: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: -7,
  },
  wideCopy: {flex: 1, minWidth: 0, justifyContent: 'center'},
  tilePicture: {overflow: 'hidden', alignSelf: 'center', flexShrink: 0},
  subcategoryName: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: 'Lato-Bold',
    color: '#111111',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  count: {
    fontSize: 11,
    fontFamily: 'Lato-Bold',
    color: colors.ink,
    flexShrink: 1,
  },
  arrow: {
    width: 22,
    height: 22,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000040'},
  filterSheet: {
    padding: 22,
    paddingBottom: 36,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  optionText: {fontSize: 16, color: colors.ink},
});
