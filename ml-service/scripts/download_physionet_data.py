"""
Download PhysioNet ECG Datasets for Training
Automatically downloads and extracts medical-grade ECG datasets
"""

import os
import urllib.request
import wfdb
from pathlib import Path

class PhysioNetDownloader:
    def __init__(self, data_dir='datasets/raw'):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def download_mit_bih(self):
        """
        MIT-BIH Arrhythmia Database
        - 48 half-hour excerpts of two-channel ambulatory ECG recordings
        - 360 Hz sampling frequency
        - Annotations for 15 different beat types
        """
        print("📥 Downloading MIT-BIH Arrhythmia Database...")
        
        database = 'mitdb'
        records = wfdb.get_record_list(database)
        
        output_dir = self.data_dir / 'mit_bih'
        output_dir.mkdir(exist_ok=True)
        
        for i, record in enumerate(records[:10]):  # Download first 10 for testing
            print(f"Downloading {record} ({i+1}/{len(records[:10])})")
            try:
                # Download signal and annotation
                record_data = wfdb.rdrecord(record, pn_dir=f'{database}/1.0.0')
                annotation = wfdb.rdann(record, 'atr', pn_dir=f'{database}/1.0.0')
                
                # Save locally
                wfdb.wrrecord(str(output_dir / record), record_data)
                wfdb.wrann(str(output_dir / record), 'atr', annotation)
                
            except Exception as e:
                print(f"Error downloading {record}: {e}")
                
        print(f"✅ MIT-BIH downloaded to {output_dir}")
        return output_dir
    
    def download_ptb(self):
        """
        PTB Diagnostic ECG Database
        - 549 records from 290 subjects
        - Includes myocardial infarction, bundle branch block, etc.
        - 1000 Hz sampling frequency
        """
        print("📥 Downloading PTB Diagnostic Database...")
        
        database = 'ptbdb'
        records = wfdb.get_record_list(database)
        
        output_dir = self.data_dir / 'ptb'
        output_dir.mkdir(exist_ok=True)
        
        for i, record in enumerate(records[:20]):  # First 20 for testing
            print(f"Downloading {record} ({i+1}/{len(records[:20])})")
            try:
                record_data = wfdb.rdrecord(record, pn_dir=f'{database}/1.0.0')
                wfdb.wrrecord(str(output_dir / record), record_data)
            except Exception as e:
                print(f"Error downloading {record}: {e}")
                
        print(f"✅ PTB downloaded to {output_dir}")
        return output_dir
    
    def download_afib_challenge(self):
        """
        AF Classification from Short ECG
        - 8,528 single lead ECG recordings
        - Length: 9-60 seconds
        - 300 Hz sampling frequency
        - Classes: Normal, AFib, Other, Noisy
        """
        print("📥 Downloading AF Challenge Dataset...")
        
        database = 'challenge-2017'
        training_dir = self.data_dir / 'afib_challenge' / 'training'
        training_dir.mkdir(parents=True, exist_ok=True)
        
        # Download reference file
        ref_url = 'https://physionet.org/files/challenge-2017/1.0.0/training2017/REFERENCE.csv'
        urllib.request.urlretrieve(ref_url, training_dir / 'REFERENCE.csv')
        
        # Read reference to get record names
        with open(training_dir / 'REFERENCE.csv', 'r') as f:
            records = [line.split(',')[0] for line in f.readlines()]
        
        for i, record in enumerate(records[:100]):  # First 100 for testing
            print(f"Downloading {record} ({i+1}/100)")
            try:
                record_data = wfdb.rdrecord(record, pn_dir=f'{database}/1.0.0/training2017')
                wfdb.wrrecord(str(training_dir / record), record_data)
            except Exception as e:
                print(f"Error downloading {record}: {e}")
                
        print(f"✅ AF Challenge downloaded to {training_dir}")
        return training_dir


def main():
    print("🚀 PhysioNet ECG Dataset Downloader")
    print("=" * 50)
    
    downloader = PhysioNetDownloader()
    
    # Download datasets
    print("\n1️⃣  Downloading MIT-BIH Arrhythmia Database...")
    mit_dir = downloader.download_mit_bih()
    
    print("\n2️⃣  Downloading PTB Diagnostic Database...")
    ptb_dir = downloader.download_ptb()
    
    print("\n3️⃣  Downloading AF Challenge Dataset...")
    afib_dir = downloader.download_afib_challenge()
    
    print("\n" + "=" * 50)
    print("✅ All datasets downloaded successfully!")
    print(f"\nData saved in: {downloader.data_dir}")
    print("\nNext steps:")
    print("1. Run: python preprocess_datasets.py")
    print("2. Run: python train_resnet_ecg.py")
    

if __name__ == '__main__':
    main()
