import React from 'react';
import { View, StyleSheet } from 'react-native';

const TableDesign = () => {
    return <View style={styles.table} />;
};

const styles = StyleSheet.create({
    table: {
        width: '100%',
        height: 300,
        backgroundColor: '#0b3d7c',
        borderRadius: 15,
    },
});

export default TableDesign;