import { Button, Input, useToast } from '@chakra-ui/react';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/config/api';

function ResetPassword(props) {
  const [inputs, setInputs] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });

  const router = useRouter();
  const toast = useToast();
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,})/;

  const handleChange = (prop) => (event) => {
    setInputs({ ...inputs, [prop]: event.target.value });
  };

  const onChangePasswordClick = async () => {
    try {
      if (!inputs.newPassword.match(passwordRegex)) {
        return toast({
          title: 'Password not secure!',
          description:
            'Must Contain at least 6 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character',
          position: 'top',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

      if (inputs.newPassword != inputs.confirmNewPassword) {
        return toast({
          title: 'Error!',
          description: `Password doesn't match`,
          position: 'top',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

      await axiosInstance.post(`users/resetPassword/${props.token}`, inputs);

      toast({
        title: 'Success!',
        description: 'Success reset password',
        position: 'top',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.replace('/');
    } catch (error) {
      console.log({ error });
      toast({
        title: 'Unexpected Fail!',
        description: error.response.data?.message
          ? error.response.data.message
          : error.message,
        position: 'top',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center">
      <div className="w-[50vw] mb-[10vh] desktop:w-[20vw]">
        <Image
          src="/forgotPassword/Medbox-logo.svg"
          alt="medbox-logo"
          layout="responsive"
          width={136}
          height={32}
        />
      </div>
      <div className="w-[80%] desktop:w-[50%] py-[10vh] flex flex-col items-center justify-center bg-white shadow-[0px_20px_36px_1px_rgba(0,28,47,0.1)]">
        <p className="text-[1.6rem] desktop:text-[2rem] font-[500] w-[100%] flex justify-center">
          Reset Password
        </p>
        <p>Enter new password.</p>
        <div
          id="new-password-input"
          className="bg-white w-[90%] desktop:w-[50%] my-[1vh] rounded-[3vw]"
        >
          <Input
            size="lg"
            type="password"
            variant="filled"
            placeholder="New password"
            onChange={handleChange('newPassword')}
          />
        </div>
        <div
          id="confirm-password-input"
          className="bg-white w-[90%] desktop:w-[50%] my-[1vh] rounded-[3vw]"
        >
          <Input
            size="lg"
            type="password"
            variant="filled"
            placeholder="Confirm new password"
            onChange={handleChange('confirmNewPassword')}
          />
        </div>
        <div id="mobile-button" className="w-[50vw] desktop:hidden">
          <Button
            onClick={onChangePasswordClick}
            style={{ width: '100%' }}
            colorScheme="linkedin"
            size="sm"
          >
            Submit
          </Button>
        </div>
        <div id="desktop-button" className="hidden desktop:inline w-[30%]">
          <Button
            onClick={onChangePasswordClick}
            style={{ width: '100%' }}
            colorScheme="linkedin"
            size="lg"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const accessToken = context.params.token;

    return {
      props: {
        token: accessToken,
      },
    };
  } catch (error) {
    console.log({ error });
    const errorMessage = error.message;
    return { props: { errorMessage } };
  }
}

export default ResetPassword;
