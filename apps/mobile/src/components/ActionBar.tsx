import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ActionBar: React.FC<{ onAction: (action: string) => void; }> = ({ onAction }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.button} onPress={() => onAction('fold')}>Fold</Text>

            <Text style={styles.button} onPress={() => onAction('call')}>Call</Text>
            <Text style={styles.button} onPress={() => onAction('raise')}>Raise</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#333',
    },
    button: {
        color: '#fff',
        fontSize: 20,
    },
});

export default ActionBar;