import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from "@/tw";

type UserRole = "All" | "Customer" | "Store Manager" | "Front Desk";

const customers = Array.from({ length: 30 }, (_, i) => {
  const names = [
    "Alex Morgan","Sarah Jenkins","Michael Chen","Emma Watson",
    "Daniel Cruz","Sophia Lee","James Carter","Olivia Brown",
    "Liam Garcia","Isabella Martinez","Noah Anderson",
    "Mia Thompson","Lucas White","Charlotte Hall",
    "Ethan Young","Amelia King","Logan Wright",
    "Harper Scott","Elijah Green","Evelyn Adams",
    "Mason Baker","Abigail Nelson","Jacob Hill",
    "Emily Rivera","William Torres","Ella Roberts",
    "Benjamin Flores","Avery Mitchell","Henry Perez","Scarlett Cox"
  ];
  
  const roles: UserRole[] = ["Customer", "Store Manager", "Front Desk"];
  const role = roles[i % 3]; 
  const name = names[i];
  const email = name.toLowerCase().replace(" ", ".") + "@example.com";

  return {
    id: `u${i + 1}`,
    name,
    email,
    role, 
    imageUri: `https://api.dicebear.com/7.x/avataaars/png?seed=${name}`,
    section: i < 5 ? "recent" : "all",
  };
});

export default function CustomersScreen() {
  const [activeTab, setActiveTab] = useState<UserRole>("All");
  const [search, setSearch] = useState("");
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // FIX: Simplified filtering logic to ensure search results are always visible
  const getFilteredData = () => {
    return customers.filter((c) => {
      const matchesRole = activeTab === "All" || c.role === activeTab;
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                            c.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  };

  const filteredData = getFilteredData();
  
  // Split data into Recent and All ONLY if search is empty
  const recentCustomers = search === "" ? filteredData.filter(c => c.section === "recent") : [];
  const allCustomersFull = search === "" ? filteredData.filter(c => c.section === "all") : filteredData;

  const totalPages = Math.max(1, Math.ceil(allCustomersFull.length / itemsPerPage));
  const displayedAllCustomers = allCustomersFull.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

const renderCustomerCard = (c: typeof customers[0]) => (
    <View
      key={c.id}
      className="flex-row items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-50 mb-2"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full overflow-hidden bg-orange-50 items-center justify-center border border-orange-100">
          <Image source={{ uri: c.imageUri }} className="w-full h-full" resizeMode="cover" />
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-poppins-bold text-slate-900">{c.name}</Text>
          <View className="flex-row items-center flex-wrap">
            <Text className="text-[12px] font-poppins text-slate-500">{c.email}</Text>
            
            {/* ROLE INDICATOR BADGE */}
            <View 
              className={`ml-2 px-2 py-0.5 rounded-md ${
                c.role === "Customer" ? "bg-blue-50" : 
                c.role === "Store Manager" ? "bg-purple-50" : "bg-green-50"
              }`}
            >
              <Text 
                className={`text-[9px] font-poppins-bold uppercase ${
                  c.role === "Customer" ? "text-blue-500" : 
                  c.role === "Store Manager" ? "text-purple-500" : "text-green-500"
                }`}
              >
                {c.role}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8f6f6]" edges={['top', 'left', 'right']}>
    {/* Header */}
      <View className="bg-primary px-6 pt-2 pb-12 rounded-b-[2rem] shadow-lg z-10">
        <View className="flex-row items-center justify-center mb-4 h-10">
          <Text className="text-white text-lg font-poppins-bold tracking-tight">
            Users
          </Text>
        </View>
                    <View className="relative bg-slate-50 rounded-lg">
          <Text className="absolute left-3 top-2.5 text-[12px] z-30">🔍</Text>
          <TextInput
            className="w-full py-2 pl-9 pr-4 text-[12px] font-poppins text-slate-800"
            // UPDATED PLACEHOLDER
            placeholder="Search by name or email..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={(text) => { 
              setSearch(text); 
              setCurrentPage(1); 
            }}
          />
        </View>
      </View>

      {/* Tabs & Search Container */}
      <View className="bg-white rounded-2xl shadow-sm p-3 -mt-6 mx-4 mb-3 z-20 border border-slate-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {(["All", "Customer", "Store Manager", "Front Desk"] as UserRole[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`h-8 px-4 rounded-full items-center justify-center mr-2 ${activeTab === tab ? "bg-primary" : "bg-slate-100"}`}
            >
              <Text className={`text-[11px] font-poppins-bold ${activeTab === tab ? "text-white" : "text-slate-500"}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Recent Section - Only visible when not searching */}
        {recentCustomers.length > 0 && search === "" && (
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-poppins-bold uppercase tracking-widest mb-2 px-1">Recent</Text>
            {recentCustomers.map(renderCustomerCard)}
          </View>
        )}

        {/* List Section */}
        {displayedAllCustomers.length > 0 ? (
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-poppins-bold uppercase tracking-widest mb-2 px-1">
              {search !== "" ? "Found Users" : (activeTab === "All" ? "All Users" : `All ${activeTab}s`)}
            </Text>
            {displayedAllCustomers.map(renderCustomerCard)}
          </View>
        ) : (
          <View className="items-center py-10">
            <Text className="text-[12px] font-poppins text-slate-400">No users found for "{search}"</Text>
          </View>
        )}

        {/* Pagination */}
        {allCustomersFull.length > itemsPerPage && (
          <View className="mt-2 flex-row justify-center items-center gap-4">
            <TouchableOpacity
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg ${currentPage === 1 ? "bg-slate-100" : "bg-slate-200"}`}
            >
              <Text className={`text-[11px] font-poppins-bold ${currentPage === 1 ? "text-slate-300" : "text-slate-600"}`}>Prev</Text>
            </TouchableOpacity>
            <Text className="text-[11px] font-poppins-bold text-slate-400">{currentPage} / {totalPages}</Text>
            <TouchableOpacity
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg ${currentPage === totalPages ? "bg-slate-100" : "bg-primary"}`}
            >
              <Text className={`text-[11px] font-poppins-bold ${currentPage === totalPages ? "text-slate-300" : "text-white"}`}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="items-center py-8 opacity-30">
          <Text className="text-[9px] font-poppins-bold tracking-widest uppercase text-slate-900">Powered by Puntos</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}